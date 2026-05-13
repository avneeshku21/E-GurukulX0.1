// EduTrack – Student Dashboard Page
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../../lib/api.js';
import ProgressRing from '../../components/ProgressRing.jsx';
import LearningActivityChart from '../../components/LearningActivityChart.jsx';
import ContestsDashboardWidget from '../../components/ContestsDashboardWidget.jsx';
import CertificateCard from '../../components/CertificateCard.jsx';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDuration(secs) {
  if (!secs) return '0:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    green:  'from-green-500 to-green-600',
    amber:  'from-amber-500 to-amber-600',
    violet: 'from-violet-500 to-violet-600',
    rose:   'from-rose-500 to-rose-600',
    sky:    'from-sky-500 to-sky-600',
  };
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[color] || colors.indigo} flex items-center justify-center text-xl shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function VideoThumb({ thumbnailUrl, youtubeVideoId, title }) {
  const src = thumbnailUrl || (youtubeVideoId ? `https://i.ytimg.com/vi/${youtubeVideoId}/mqdefault.jpg` : null);
  if (!src) return <div className="w-24 h-14 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />;
  return <img src={src} alt={title ?? ''} className="w-24 h-14 rounded-lg object-cover shrink-0 bg-slate-200 dark:bg-slate-800" />;
}

// ── Continue Watching ─────────────────────────────────────────────────────────
function ContinueWatchingCard({ item }) {
  if (!item) return null;
  const playlistId = item.playlist?.id;
  const href = playlistId ? `/watch/${playlistId}?video=${item.youtubeVideoId}` : '#';
  const pct = item.durationSeconds > 0 ? Math.round((item.watchedSeconds / item.durationSeconds) * 100) : 0;
  return (
    <Link to={href} className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-shadow group">
      <div className="relative shrink-0">
        <VideoThumb thumbnailUrl={item.thumbnailUrl} youtubeVideoId={item.youtubeVideoId} title={item.title} />
        <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg bg-slate-300 dark:bg-slate-700 overflow-hidden">
          <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{item.playlist?.name}</p>
        <p className="text-xs text-slate-400 mt-1">{formatDuration(item.watchedSeconds)} watched · {timeAgo(item.lastWatchedAt)}</p>
      </div>
      <span className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold group-hover:bg-indigo-700 transition-colors">Resume</span>
    </Link>
  );
}

// ── Recently Completed Videos ─────────────────────────────────────────────────
function RecentVideoCard({ item }) {
  const playlistId = item.playlist?.id;
  const href = playlistId ? `/watch/${playlistId}?video=${item.youtubeVideoId}` : '#';
  return (
    <Link to={href} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 hover:shadow-md transition-shadow group">
      <VideoThumb thumbnailUrl={item.thumbnailUrl} youtubeVideoId={item.youtubeVideoId} title={item.title} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.title}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{item.playlist?.name}</p>
        {item.channelTitle && <p className="text-[11px] text-slate-400 truncate">{item.channelTitle}</p>}
        <p className="text-[11px] text-green-600 dark:text-green-400 mt-1 font-medium">✅ {timeAgo(item.completedAt)}</p>
      </div>
    </Link>
  );
}

// ── Completed Playlist Card ───────────────────────────────────────────────────
function CompletedPlaylistCard({ pl }) {
  const href = `/watch/${pl.id}`;
  return (
    <Link to={href} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-shadow group">
      {pl.thumbnailUrl
        ? <img src={pl.thumbnailUrl} alt={pl.name} className="w-14 h-10 rounded-lg object-cover shrink-0" />
        : <div className="w-14 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shrink-0">✅</div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{pl.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{pl.totalVideos} videos · {pl.category?.name ?? ''}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-green-100 dark:bg-green-900/40 overflow-hidden">
            <div className="h-full bg-green-500 rounded-full w-full" />
          </div>
          <span className="text-[11px] font-bold text-green-600 dark:text-green-400">100%</span>
        </div>
      </div>
      {pl.certificateIssued && <span className="text-lg shrink-0" title="Certificate earned">🎓</span>}
    </Link>
  );
}

export default function StudentDashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(() => {
    get('/progress/dashboard')
      .then(d => setData(d.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  useEffect(() => {
    const handleFocus = () => fetchDashboard();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchDashboard();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const stats             = data?.stats             ?? {};
  const playlists         = data?.playlists         ?? [];
  const certs             = data?.certificates      ?? [];
  const activitySeries    = data?.activitySeries    ?? {};
  const recent            = data?.recentNotes       ?? [];
  const continueWatching  = data?.continueWatching  ?? null;
  const recentlyCompleted = data?.recentlyCompleted ?? [];
  const completedPlaylists = data?.completedPlaylists ?? [];

  const inProgressPlaylists = playlists.filter(p => (p.progressPercent ?? 0) < 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Welcome back! Keep up the great work.</p>
        </div>
        <Link to="/discover" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
          + Discover Videos
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon="🔥" label="Current Streak"  value={stats.currentStreak ?? 0}       sub="days"                                    color="rose"   />
        <StatCard icon="⚡" label="Longest Streak"  value={stats.longestStreak ?? 0}        sub="days"                                    color="amber"  />
        <StatCard icon="✅" label="Videos Done"     value={stats.totalVideosCompleted ?? 0} sub={`of ${stats.totalVideos ?? 0}`}          color="green"  />
        <StatCard icon="⏱️" label="Hours Watched"  value={stats.hoursWatched ?? 0}          sub="total hours"                             color="sky"    />
        <StatCard icon="📚" label="Playlists"       value={stats.totalPlaylists ?? 0}       sub={`${stats.completedCount ?? 0} completed`} color="indigo" />
        <StatCard icon="🎓" label="Certificates"   value={stats.certificateCount ?? 0}      sub="earned"                                  color="violet" />
      </div>

      {/* ── Continue Watching ──────────────────────────────────────────────────── */}
      {continueWatching && (
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">▶️ Continue Watching</h2>
          <ContinueWatchingCard item={continueWatching} />
        </section>
      )}

      {/* Progress ring + chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
          <ProgressRing percent={stats.overallPercent ?? 0} size={140} />
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            {stats.inProgressCount ?? 0} in progress · {stats.completedCount ?? 0} completed
          </p>
          <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between"><span>Avg completion</span><span className="font-semibold text-slate-700 dark:text-slate-200">{stats.avgCompletionPct ?? 0}%</span></div>
            <div className="flex justify-between"><span>Watch hours</span><span className="font-semibold text-slate-700 dark:text-slate-200">{stats.totalWatchHours ?? 0}h</span></div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <LearningActivityChart series={activitySeries} />
        </div>
      </div>

      {/* ── Enrolled / In-Progress Playlists ──────────────────────────────────── */}
      {inProgressPlaylists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">My Enrolled Playlists</h2>
            <Link to="/my-playlists" className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inProgressPlaylists.slice(0, 6).map(pl => {
              const pct = pl.progressPercent ?? 0;
              const done = pl.completedCount ?? 0;
              const total = pl.totalVideos ?? 0;
              const firstIncompleteVideo = (pl.videos ?? []).find(v => !v.isCompleted);
              const ytId = firstIncompleteVideo?.youtubeVideoId;
              const status = pct === 0 ? 'Not Started' : 'In Progress';
              return (
                <Link
                  key={pl.id}
                  to={`/watch/${pl.id}${ytId ? `?video=${ytId}` : ''}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 hover:shadow-md transition-shadow group"
                >
                  {pl.thumbnailUrl && (
                    <img src={pl.thumbnailUrl} alt={pl.name} className="w-full h-28 rounded-lg object-cover mb-3" />
                  )}
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{pl.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{done}/{total} videos</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{pct}%</span>
                  </div>
                  <span className={`inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${pct === 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'}`}>
                    {status}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Recently Completed Videos ──────────────────────────────────────────── */}
      {recentlyCompleted.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">Recently Completed Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentlyCompleted.slice(0, 9).map(item => (
              <RecentVideoCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed Playlists ────────────────────────────────────────────────── */}
      {completedPlaylists.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">✅ Completed Playlists</h2>
            <span className="text-xs text-slate-400">{completedPlaylists.length} completed</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedPlaylists.map(pl => <CompletedPlaylistCard key={pl.id} pl={pl} />)}
          </div>
        </section>
      )}

      {/* ── Certificates ──────────────────────────────────────────────────────── */}
      {certs.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">Certificates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {certs.slice(0, 3).map(cert => (
              <CertificateCard
                key={cert.id}
                certificate={{
                  id: cert.id,
                  certificateId: cert.certificateId,
                  playlistName: cert.playlist?.name ?? 'Completed Playlist',
                  issuedAt: cert.issuedAt,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Notes ───────────────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Recent Notes</h2>
            <Link to="/my-notes" className="text-xs text-indigo-600 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recent.map(note => (
              <div key={note.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate">{note.video?.title ?? 'Note'}</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{note.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contests & Hackathons Widget */}
      <ContestsDashboardWidget />
    </div>
  );
}
