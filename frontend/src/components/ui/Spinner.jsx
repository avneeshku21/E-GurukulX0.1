// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Spinner Component
// Exports: Spinner (inline), LoadingSpinner (full-page)
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';

// ── Size maps ─────────────────────────────────────────────────────────────────

const circleSizes = {
  xs:  'w-3   h-3   border-[1.5px]',
  sm:  'w-4   h-4   border-2',
  md:  'w-6   h-6   border-2',
  lg:  'w-8   h-8   border-[3px]',
  xl:  'w-12  h-12  border-4',
};

const dotSizes = {
  xs:  'w-1   h-1',
  sm:  'w-1.5 h-1.5',
  md:  'w-2   h-2',
  lg:  'w-2.5 h-2.5',
  xl:  'w-3.5 h-3.5',
};

const colorClasses = {
  current:  '',                                         // inherits text color
  white:    'border-white/30 border-t-white',
  indigo:   'border-indigo-200 border-t-indigo-600 dark:border-indigo-900 dark:border-t-indigo-400',
  slate:    'border-slate-200 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-300',
};

const dotColorClasses = {
  current: 'bg-current',
  white:   'bg-white',
  indigo:  'bg-indigo-600 dark:bg-indigo-400',
  slate:   'bg-slate-600 dark:bg-slate-300',
};

/**
 * Spinner
 *
 * @param {'xs'|'sm'|'md'|'lg'|'xl'}        size
 * @param {'current'|'white'|'indigo'|'slate'} color
 * @param {'circle'|'dots'}                  variant
 */
export function Spinner({
  size    = 'md',
  color   = 'indigo',
  variant = 'circle',
  className,
}) {
  if (variant === 'dots') {
    return (
      <span
        role="status"
        aria-label="Loading"
        className={cn('inline-flex items-center gap-1', className)}
      >
        <span className={cn('rounded-full animate-dot-1', dotColorClasses[color] ?? dotColorClasses.indigo, dotSizes[size] ?? dotSizes.md)} />
        <span className={cn('rounded-full animate-dot-2', dotColorClasses[color] ?? dotColorClasses.indigo, dotSizes[size] ?? dotSizes.md)} />
        <span className={cn('rounded-full animate-dot-3', dotColorClasses[color] ?? dotColorClasses.indigo, dotSizes[size] ?? dotSizes.md)} />
      </span>
    );
  }

  // Default: circle border spinner
  const circleColor =
    color === 'current'
      ? 'border-current/30 border-t-current'
      : (colorClasses[color] ?? colorClasses.indigo);

  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full animate-spin',
        circleColor,
        circleSizes[size] ?? circleSizes.md,
        className,
      )}
    />
  );
}

/**
 * LoadingSpinner
 * Full-page centered spinner — used by ProtectedRoute and any page-level loader.
 *
 * @param {boolean} fullScreen  - Use 100vh height instead of min-h-[60vh]
 */
export function LoadingSpinner({ fullScreen = false, message }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen ? 'min-h-screen' : 'min-h-[60vh]',
        'bg-white dark:bg-slate-950',
      )}
      role="status"
      aria-live="polite"
      aria-label={message ?? 'Loading'}
    >
      <Spinner size="xl" color="indigo" />
      {message && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      )}
    </div>
  );
}

export default Spinner;
