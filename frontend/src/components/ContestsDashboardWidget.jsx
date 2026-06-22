// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – ContestsDashboardWidget
// Shows live/upcoming count + next contest with countdown on the student dashboard
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../lib/api.js';
import { cn } from '../lib/utils.js';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'live', label: 'Live' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'hackathon', label: 'Hackathons' },
];

function Countdown({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setTimeLeft('Starting now'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{timeLeft}</span>;
}

function PlatformLogo({ logo, label }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 text-xs font-bold">
        {label?.charAt(0) ?? '?'}
      </div>
    );
  }
  return <img src={logo} alt={label} onError={() => setErr(true)} className="w-6 h-6 rounded-full object-contain bg-white border border-slate-100 dark:border-slate-700" />;
}

export default function ContestsDashboardWidget() {
  const [stats, setStats] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [sections, setSections] = useState({ live: [], upcoming: [], hackathons: [] });
  const [platform, setPlatform] = useState('');
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [statsResult, platformsResult, liveResult, upcomingResult, hackathonResult] = await Promise.allSettled([
        get('/contests/stats'),
        get('/contests/platforms'),
        get('/contests', { status: 'live', limit: 6, sort: 'startTime', ...(platform ? { platform } : {}) }),
        get('/contests', { status: 'upcoming', limit: 6, sort: 'startTime', ...(platform ? { platform } : {}) }),
        get('/contests', { type: 'hackathon', limit: 6, sort: 'startTime', ...(platform ? { platform } : {}) }),
      ]);

      const liveContests = liveResult.status === 'fulfilled' ? liveResult.value.data?.data?.contests ?? [] : [];
      const upcomingContests = upcomingResult.status === 'fulfilled' ? upcomingResult.value.data?.data?.contests ?? [] : [];
      const hackathonContests = hackathonResult.status === 'fulfilled' ? hackathonResult.value.data?.data?.contests ?? [] : [];

      setSections({
        live: liveContests,
        upcoming: upcomingContests,
        hackathons: hackathonContests,
      });

      setStats(
        statsResult.status === 'fulfilled'
          ? statsResult.value.data?.data ?? null
          : {
              live: liveContests.length,
              upcoming: upcomingContests.length,
              hackathons: hackathonContests.length,
            },
      );

      if (platformsResult.status === 'fulfilled') {
        setPlatforms(platformsResult.value.data?.data?.platforms ?? []);
      } else {
        const platformMap = new Map();
        [...liveContests, ...upcomingContests, ...hackathonContests].forEach((contest) => {
          if (!contest?.platform) return;
          if (!platformMap.has(contest.platform)) {
            platformMap.set(contest.platform, {
              platform: contest.platform,
              label: contest.platformLabel ?? contest.platform,
              logo: contest.platformLogo ?? '',
            });
          }
        });
        setPlatforms([...platformMap.values()]);
      }

      const contestRequestsFailed =
        liveResult.status !== 'fulfilled' &&
        upcomingResult.status !== 'fulfilled' &&
        hackathonResult.status !== 'fulfilled';

      if (contestRequestsFailed) {
        setError('Failed to load contests.');
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Failed to load contests.');
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  useEffect(() => {
    const id = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadData]);

  const filteredSections = useMemo(() => {
    const matchesDate = (contest) => {
      if (!date) return true;
      return contest?.startTime?.slice(0, 10) === date;
    };

    return {
      live: (sections.live ?? []).filter(matchesDate),
      upcoming: (sections.upcoming ?? []).filter(matchesDate),
      hackathons: (sections.hackathons ?? []).filter(matchesDate),
    };
  }, [date, sections]);

  const visibleSections = [
    { key: 'live', title: 'Live Contests', items: filteredSections.live, accent: 'text-green-500' },
    { key: 'upcoming', title: 'Upcoming Contests', items: filteredSections.upcoming, accent: 'text-blue-500' },
    { key: 'hackathon', title: 'Hackathons', items: filteredSections.hackathons, accent: 'text-orange-500' },
  ].filter((section) => status === 'all' || status === section.key);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />)}
        </div>
        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  function formatDateTime(value) {
    if (!value) return 'TBA';
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function formatContestDuration(seconds) {
    const total = Math.max(0, Math.floor((seconds || 0) / 60));
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Contests & Hackathons</h3>
        </div>
        <Link to="/contests" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats?.live ?? 0}</div>
          <div className="text-[10px] text-green-600/70 dark:text-green-400/70 font-medium">Live Now</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats?.upcoming ?? 0}</div>
          <div className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium">Upcoming</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2.5 text-center">
          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats?.hackathons ?? 0}</div>
          <div className="text-[10px] text-orange-600/70 dark:text-orange-400/70 font-medium">Hackathons</div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                  status === filter.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Platforms</option>
              {platforms.map((entry) => (
                <option key={entry.platform} value={entry.platform}>{entry.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        ) : visibleSections.every((section) => section.items.length === 0) ? (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No contests match the selected filters right now.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleSections.map((section) => (
              <div key={section.key}>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className={cn('text-sm font-semibold text-slate-800 dark:text-slate-200', section.accent)}>{section.title}</h4>
                  <span className="text-[11px] text-slate-400">{section.items.length} items</span>
                </div>
                <div className="space-y-2">
                  {section.items.slice(0, 3).map((contest) => {
                    const isLive = contest.status === 'live';
                    return (
                      <div key={contest.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                        <div className="flex items-start gap-3">
                          <PlatformLogo logo={contest.platformLogo} label={contest.platformLabel} />
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-[10px] text-slate-400">{contest.platformLabel}</span>
                              <span className={cn(
                                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                isLive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
                              )}>
                                {isLive ? 'Live' : 'Upcoming'}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{contest.title}</p>
                            <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                              <span>Start: {formatDateTime(contest.startTime)}</span>
                              <span>End: {formatDateTime(contest.endTime)}</span>
                              <span>Duration: {formatContestDuration(contest.durationSeconds)}</span>
                              <span>
                                {isLive ? 'Ends in: ' : 'Starts in: '}
                                <Countdown targetDate={isLive ? contest.endTime : contest.startTime} />
                              </span>
                            </div>
                          </div>
                          <a
                            href={contest.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                          >
                            {isLive ? 'Join Now' : 'Register'}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
      )}
      </div>
    </div>
  );
}
