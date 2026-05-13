// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Tabs Component
// Underline-style with animated bottom border and optional count badges.
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';

/**
 * Tabs
 *
 * @param {{ id: string, label: string, icon?: React.ReactNode, count?: number }[]} tabs
 * @param {string}   activeTab   - id of the currently active tab
 * @param {function} onChange    - (tabId: string) => void
 */
export default function Tabs({
  tabs      = [],
  activeTab,
  onChange,
  className,
}) {
  return (
    <div
      className={cn('flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar', className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange?.(tab.id)}
            className={cn(
              // Base layout
              'relative flex items-center gap-2 px-4 py-3',
              'text-sm font-medium whitespace-nowrap select-none',
              'transition-colors duration-150',
              // Bottom border indicator (always present, colored when active)
              'after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5',
              'after:rounded-t-full after:transition-colors after:duration-150',
              // Active state
              isActive
                ? [
                    'text-indigo-600 dark:text-indigo-400',
                    'after:bg-indigo-600 dark:after:bg-indigo-400',
                  ]
                : [
                    'text-slate-500 dark:text-slate-400',
                    'hover:text-slate-700 dark:hover:text-slate-200',
                    'after:bg-transparent',
                  ],
            )}
          >
            {/* Optional icon */}
            {tab.icon && (
              <span className="shrink-0 text-[1em]" aria-hidden="true">
                {tab.icon}
              </span>
            )}

            {tab.label}

            {/* Count badge */}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-5',
                  'rounded-full text-[10px] font-semibold px-1.5',
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                )}
              >
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
