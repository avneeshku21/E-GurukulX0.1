// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – PageHeader
// Breadcrumbs + title/subtitle + right-side action slot.
// ─────────────────────────────────────────────────────────────────────────────

import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils.js';

// Inline chevron for breadcrumb separator
const ChevronRightIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
    <path strokeLinecap="round" d="M9 5l7 7-7 7"/>
  </svg>
);

/**
 * PageHeader
 *
 * @param {string}   title
 * @param {string}   [subtitle]
 * @param {{ label: string, to?: string }[]} [breadcrumbs]
 *   Each entry is a { label, to? } object. The last entry is always the current
 *   page (rendered as plain text). Earlier entries render as <Link>.
 * @param {React.ReactNode} [actions]  - Buttons / controls shown in the top-right
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  className,
}) {
  return (
    <div className={cn('mb-6 flex flex-col gap-3', className)}>

      {/* ── Breadcrumbs ─────────────────────────────────────────────────── */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center flex-wrap gap-1">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <li key={crumb.label} className="flex items-center gap-1">
                  {idx > 0 && <ChevronRightIcon />}
                  {isLast || !crumb.to ? (
                    <span
                      aria-current={isLast ? 'page' : undefined}
                      className={cn(
                        'text-sm',
                        isLast
                          ? 'font-medium text-slate-700 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400',
                      )}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.to}
                      className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* ── Title row ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 truncate">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right-side actions */}
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
