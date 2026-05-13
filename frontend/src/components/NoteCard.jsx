// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – NoteCard
// ─────────────────────────────────────────────────────────────────────────────

import { cn, formatRelativeTime, truncate } from '../lib/utils.js';
import Badge from './ui/Badge.jsx';

const TYPE_VARIANT = { TEXT: 'primary', CODE: 'secondary', QUIZ: 'success' };
const TYPE_LABEL   = { TEXT: '📝 Text',  CODE: '💻 Code',   QUIZ: '🧠 Quiz' };

const TAG_COLORS = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  'bg-pink-100   text-pink-700   dark:bg-pink-950   dark:text-pink-300',
  'bg-amber-100  text-amber-700  dark:bg-amber-950  dark:text-amber-300',
  'bg-teal-100   text-teal-700   dark:bg-teal-950   dark:text-teal-300',
];

const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const LinkIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

function getContentPreview(note) {
  try {
    const raw = typeof note.content === 'string' ? JSON.parse(note.content) : (note.content ?? {});

    if (note.type === 'CODE') {
      return truncate(raw.code ?? '', 100);
    }
    if (note.type === 'QUIZ') {
      const q = raw.questions?.[0];
      return q ? `Q: ${truncate(q.question ?? '', 80)}` : 'Quiz note';
    }
    // TEXT — strip HTML tags from TipTap html
    const html = raw.html ?? raw.text ?? '';
    const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return truncate(plain, 100);
  } catch {
    const text = String(note.content ?? '').replace(/<[^>]+>/g, ' ').trim();
    return truncate(text, 100);
  }
}

/**
 * NoteCard
 *
 * @param {{ id, type, title, content, language, tags, linkedVideoId, createdAt }} note
 * @param {function} onEdit   - called with `note`
 * @param {function} onDelete - called with `note`
 */
export default function NoteCard({ note, onEdit, onDelete }) {
  const preview      = getContentPreview(note);
  const tags         = note.tags ?? [];
  const visibleTags  = tags.slice(0, 3);
  const hiddenCount  = tags.length - visibleTags.length;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow duration-200">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={TYPE_VARIANT[note.type] ?? 'ghost'} size="sm">
            {TYPE_LABEL[note.type] ?? note.type}
          </Badge>
          {note.type === 'CODE' && note.language && (
            <Badge variant="ghost" size="sm">{note.language}</Badge>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onEdit?.(note)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
            aria-label="Edit note"
          >
            <EditIcon />
          </button>
          <button
            onClick={() => onDelete?.(note)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            aria-label="Delete note"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* ── Title ─────────────────────────────────────────────────────── */}
      <h3 className="font-medium text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
        {note.title}
      </h3>

      {/* ── Content preview ───────────────────────────────────────────── */}
      {preview && (
        <p className={cn(
          'text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed',
          note.type === 'CODE' && 'font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1.5 rounded',
        )}>
          {preview}
        </p>
      )}

      {/* ── Tags ──────────────────────────────────────────────────────── */}
      {visibleTags.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5">
          {visibleTags.map((tag, i) => (
            <span
              key={tag}
              className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                TAG_COLORS[i % TAG_COLORS.length],
              )}
            >
              #{tag}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="text-[10px] text-slate-400">+{hiddenCount} more</span>
          )}
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        {note.linkedVideoId ? (
          <span className="flex items-center gap-1 text-[10px] text-slate-400">
            <LinkIcon /> Linked to video
          </span>
        ) : (
          <span />
        )}
        <span className="text-[10px] text-slate-400">{formatRelativeTime(note.createdAt)}</span>
      </div>
    </div>
  );
}
