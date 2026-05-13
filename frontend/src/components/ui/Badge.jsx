// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Badge Component
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';

const variantClasses = {
  primary:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  secondary:
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  success:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning:
    'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger:
    'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  outline:
    'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-transparent',
  ghost:
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const dotColors = {
  primary:   'bg-indigo-500',
  secondary: 'bg-violet-500',
  success:   'bg-emerald-500',
  warning:   'bg-amber-500',
  danger:    'bg-red-500',
  outline:   'bg-slate-400',
  ghost:     'bg-slate-400',
};

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2   py-0.5 gap-1.5',
  lg: 'text-sm px-2.5 py-1   gap-1.5',
};

/**
 * Badge
 *
 * @param {'primary'|'secondary'|'success'|'warning'|'danger'|'outline'|'ghost'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {boolean} dot  - Show a colored dot indicator before the label
 */
export default function Badge({
  variant  = 'primary',
  size     = 'md',
  dot      = false,
  children,
  className,
  ...rest
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size]       ?? sizeClasses.md,
        className,
      )}
      {...rest}
    >
      {dot && (
        <span
          className={cn(
            'shrink-0 rounded-full w-1.5 h-1.5',
            dotColors[variant] ?? dotColors.primary,
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
