// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – PlaylistCard
// 2×2 thumbnail grid + progress + 3-dot menu (rename / delete)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ui/ProgressBar.jsx';
import Badge      from './ui/Badge.jsx';
import Dropdown   from './ui/Dropdown.jsx';
import ConfirmDialog from './ui/ConfirmDialog.jsx';
import { cn, formatRelativeTime } from '../lib/utils.js';

const DotsIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="5"  r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="19" r="1.5" />
  </svg>
);

const PLACEHOLDER_COLORS = [
  'bg-indigo-200 dark:bg-indigo-900',
  'bg-violet-200 dark:bg-violet-900',
  'bg-pink-200   dark:bg-pink-900',
  'bg-amber-200  dark:bg-amber-900',
];

export default function PlaylistCard({ playlist, onDelete, onRename, onClick }) {
  const navigate = useNavigate();

  const [renaming,    setRenaming]    = useState(false);
  const [delConfirm,  setDelConfirm]  = useState(false);
  const [newName,     setNewName]     = useState(playlist.name);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef(null);

  const thumbVideos = (playlist.videos ?? []).slice(0, 4);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const handleCardClick = () => {
    if (renaming) return;
    onClick ? onClick(playlist) : navigate(`/playlist/${playlist.id}`);
  };

  const handleRenameSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || trimmed === playlist.name) {
      setRenaming(false);
      setNewName(playlist.name);
      return;
    }
    setIsSubmitting(true);
    try {
      await onRename?.(playlist.id, trimmed);
    } catch {
      setNewName(playlist.name);
    } finally {
      setIsSubmitting(false);
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      onDelete?.(playlist.id);
    } catch {
      setIsSubmitting(false);
      throw new Error('delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const percent   = playlist.progressPercent ?? 0;
  const completed = playlist.completedVideos  ?? 0;
  const total     = playlist.totalVideos      ?? 0;

  return (
    <div
      className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      {/* ── 2×2 Thumbnail grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 bg-slate-100 dark:bg-slate-800" style={{ aspectRatio: '16/9' }}>
        {Array.from({ length: 4 }, (_, i) => {
          const vid = thumbVideos[i];
          return (
            <div key={i} className="relative overflow-hidden border-[0.5px] border-white/20">
              {vid?.thumbnail ? (
                <img
                  src={vid.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  loading="lazy"
                />
              ) : (
                <div className={cn('w-full h-full', PLACEHOLDER_COLORS[i % 4])} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-2.5">
        {/* Category badge */}
        {playlist.category && (
          <Badge variant="primary" size="sm" dot>
            {playlist.category.icon} {playlist.category.name}
          </Badge>
        )}

        {/* Playlist name / rename input */}
        {renaming ? (
          <form
            onSubmit={handleRenameSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => { setRenaming(false); setNewName(playlist.name); }}
              maxLength={100}
              disabled={isSubmitting}
              className="w-full text-sm font-semibold rounded-lg border border-indigo-400 px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </form>
        ) : (
          <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug pr-4">
            {playlist.name}
          </h3>
        )}

        {/* Progress bar */}
        <ProgressBar percent={percent} size="sm" />

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{completed}/{total} videos · {percent}%</span>
          <span>{formatRelativeTime(playlist.updatedAt)}</span>
        </div>
      </div>

      <ConfirmDialog
        isOpen={delConfirm}
        onClose={() => setDelConfirm(false)}
        title="Delete Playlist?"
        description={`Delete "${playlist.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />

      {/* ── 3-dot menu ──────────────────────────────────────────────────── */}
      <div className="absolute top-[calc(50%+8px)] right-3 z-10" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          align="right"
          trigger={(
            <button
              aria-label="Playlist options"
              className={cn(
                'p-1.5 rounded-lg shadow-sm transition-all duration-150',
                'bg-white/90 dark:bg-slate-900/90 text-slate-500',
                'hover:text-slate-900 dark:hover:text-slate-100',
                'opacity-0 group-hover:opacity-100 focus:opacity-100',
              )}
            >
              <DotsIcon />
            </button>
          )}
          items={[
            { label: 'Rename', icon: '✏️', onClick: () => setRenaming(true) },
            { type: 'divider' },
            { label: 'Delete', icon: '🗑️', onClick: () => setDelConfirm(true), isDanger: true },
          ]}
        />
      </div>
    </div>
  );
}
