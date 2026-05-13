// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – ContestCard Component
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { cn } from '../lib/utils.js';
import { patch, post, del } from '../lib/api.js';
import { toast } from 'sonner';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ── Countdown Timer ──────────────────────────────────────────────────────────
function Countdown({ targetDate, label }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - Date.now();
      if (diff <= 0) { setTimeLeft('Now'); return; }
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

  return (
    <div className="text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400">{timeLeft}</div>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === 'live') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      LIVE
    </span>
  );
  if (status === 'upcoming') return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
      UPCOMING
    </span>
  );
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      ENDED
    </span>
  );
}

// ── Type Badge ────────────────────────────────────────────────────────────────
const TYPE_COLORS = {
  contest:    'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  hackathon:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  challenge:  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  aiml:       'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  webdev:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  internship: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};
const TYPE_LABELS = {
  contest: 'Contest', hackathon: 'Hackathon', challenge: 'Challenge',
  aiml: 'AI/ML', webdev: 'Web Dev', internship: 'Internship',
};

// ── Platform Logo ────────────────────────────────────────────────────────────
function PlatformLogo({ logo, label }) {
  const [err, setErr] = useState(false);
  if (!logo || err) {
    return (
      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 text-xs font-bold">
        {label?.charAt(0) ?? '?'}
      </div>
    );
  }
  return <img src={logo} alt={label} onError={() => setErr(true)} className="w-7 h-7 rounded-full object-contain bg-white border border-slate-100 dark:border-slate-700" />;
}

// ── Main ContestCard ──────────────────────────────────────────────────────────
export default function ContestCard({ contest, onSaveToggle }) {
  const [saved, setSaved]         = useState(contest.isSaved ?? false);
  const [reminder, setReminder]   = useState(contest.hasReminder ?? false);
  const [savingState, setSaving]  = useState(false);
  const [remindState, setReminding] = useState(false);

  const isEnded = contest.status === 'ended';

  const handleSave = async (e) => {
    e.stopPropagation();
    if (savingState) return;
    setSaving(true);
    try {
      if (saved) {
        await del(`/contests/${contest.id}/save`);
        setSaved(false);
        toast.success('Contest removed from saved');
      } else {
        await post(`/contests/${contest.id}/save`);
        setSaved(true);
        toast.success('Contest saved!');
      }
      onSaveToggle?.();
    } catch {
      toast.error('Failed to update saved status');
    } finally {
      setSaving(false);
    }
  };

  const handleReminder = async (e) => {
    e.stopPropagation();
    if (remindState) return;
    setReminding(true);
    try {
      const newVal = !reminder;
      await patch(`/contests/${contest.id}/reminder`, { reminder: newVal, minutesBefore: 30 });
      setReminder(newVal);
      toast.success(newVal ? 'Reminder set — 30 min before start' : 'Reminder removed');
    } catch {
      toast.error('Failed to update reminder');
    } finally {
      setReminding(false);
    }
  };

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden',
      isEnded ? 'opacity-60 border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700',
    )}>
      {/* ── Top accent bar by type ──────────────────────────────────────── */}
      <div className={cn('h-1 w-full', {
        'bg-gradient-to-r from-violet-500 to-purple-600': contest.type === 'contest',
        'bg-gradient-to-r from-orange-400 to-pink-500':   contest.type === 'hackathon',
        'bg-gradient-to-r from-pink-500 to-rose-600':     contest.type === 'aiml',
        'bg-gradient-to-r from-emerald-400 to-cyan-500':  contest.type === 'webdev',
        'bg-gradient-to-r from-yellow-400 to-orange-400': contest.type === 'internship',
        'bg-gradient-to-r from-indigo-400 to-blue-500':   !['contest','hackathon','aiml','webdev','internship'].includes(contest.type),
      })} />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* ── Header row ───────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <PlatformLogo logo={contest.platformLogo} label={contest.platformLabel} />
            <div className="min-w-0">
              <div className="text-xs text-slate-400 truncate">{contest.platformLabel}</div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">
                {contest.title}
              </h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <StatusBadge status={contest.status} />
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', TYPE_COLORS[contest.type] ?? TYPE_COLORS.contest)}>
              {TYPE_LABELS[contest.type] ?? 'Contest'}
            </span>
          </div>
        </div>

        {/* ── Description ──────────────────────────────────────────────── */}
        {contest.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {contest.description}
          </p>
        )}

        {/* ── Timing grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-2">
            <div className="text-slate-400 mb-0.5">Starts</div>
            <div className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">{formatDate(contest.startTime)}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-2">
            <div className="text-slate-400 mb-0.5">Ends</div>
            <div className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">{formatDate(contest.endTime)}</div>
          </div>
        </div>

        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-600 dark:text-slate-400">
            ⏱ {formatDuration(contest.durationSeconds)}
          </span>
          {contest.difficulty && contest.difficulty !== 'any' && (
            <span className={cn('px-2 py-1 rounded-full', {
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':  contest.difficulty === 'beginner',
              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': contest.difficulty === 'intermediate',
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':         contest.difficulty === 'advanced',
            })}>
              {contest.difficulty.charAt(0).toUpperCase() + contest.difficulty.slice(1)}
            </span>
          )}
          {contest.prizePool && (
            <span className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
              🏆 {contest.prizePool}
            </span>
          )}
          {contest.isFree && (
            <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">Free</span>
          )}
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500">{contest.mode}</span>
        </div>

        {/* ── Tags ─────────────────────────────────────────────────────── */}
        {contest.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {contest.tags.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Countdown (for upcoming/live) ─────────────────────────── */}
        {!isEnded && (
          <div className="flex justify-around border-t border-slate-100 dark:border-slate-800 pt-2">
            {contest.status === 'upcoming' && <Countdown targetDate={contest.startTime} label="Starts in" />}
            {contest.status === 'live'     && <Countdown targetDate={contest.endTime}   label="Ends in" />}
          </div>
        )}

        {/* ── Action Buttons ────────────────────────────────────────────── */}
        <div className="mt-auto flex gap-2">
          <a
            href={contest.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              if (!isEnded) {
                patch(`/contests/${contest.id}/participated`, {}).catch(() => {});
              }
            }}
            className={cn(
              'flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center transition-colors',
              isEnded
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed pointer-events-none'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white',
            )}
          >
            {isEnded ? 'Ended' : '🚀 Participate Now'}
          </a>

          {/* Reminder */}
          <button
            onClick={handleReminder}
            disabled={remindState || isEnded}
            title={reminder ? 'Remove reminder' : 'Set reminder (30 min before)'}
            className={cn(
              'p-2 rounded-xl border text-sm transition-colors',
              reminder
                ? 'bg-amber-50 border-amber-300 text-amber-600 dark:bg-amber-900/30 dark:border-amber-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-amber-300 hover:text-amber-500',
            )}
          >
            🔔
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={savingState}
            title={saved ? 'Remove from saved' : 'Save contest'}
            className={cn(
              'p-2 rounded-xl border text-sm transition-colors',
              saved
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-300 hover:text-indigo-500',
            )}
          >
            {saved ? '🔖' : '🏷️'}
          </button>
        </div>
      </div>
    </div>
  );
}
