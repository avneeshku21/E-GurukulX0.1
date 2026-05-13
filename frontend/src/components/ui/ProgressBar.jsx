// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – ProgressBar Component
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';

function getBarColor(percent) {
  if (percent === 100) return 'bg-green-500';
  if (percent >= 67)   return 'bg-blue-500';
  if (percent >= 34)   return 'bg-amber-500';
  return 'bg-red-500';
}

function getLabel(percent) {
  if (percent === 100) return 'Completed!';
  if (percent >= 67)   return 'Almost There!';
  if (percent >= 34)   return 'In Progress';
  return 'Just Started';
}

function getTextColor(percent) {
  if (percent === 100) return 'text-green-600 dark:text-green-400';
  if (percent >= 67)   return 'text-blue-600 dark:text-blue-400';
  if (percent >= 34)   return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

const trackHeights = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

/**
 * ProgressBar
 *
 * @param {number}                       percent      - 0–100
 * @param {'xs'|'sm'|'md'|'lg'}          size
 * @param {boolean}                      showLabel    - Show text label ("In Progress", etc.)
 * @param {boolean}                      showPercent  - Show "42%" text
 * @param {boolean}                      animated     - Animated gradient for 100%
 */
export default function ProgressBar({
  percent     = 0,
  size        = 'md',
  showLabel   = false,
  showPercent = false,
  animated    = true,
  className,
}) {
  const pct       = Math.min(100, Math.max(0, Math.round(percent)));
  const barColor  = getBarColor(pct);
  const label     = getLabel(pct);
  const textColor = getTextColor(pct);
  const isComplete = pct === 100;

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {(showLabel || showPercent) && (
        <div className="flex items-center justify-between">
          {showLabel && (
            <span className={cn('text-xs font-medium', textColor)}>
              {label}
            </span>
          )}
          {showPercent && (
            <span className={cn('text-xs font-semibold tabular-nums ml-auto', textColor)}>
              {pct}%
            </span>
          )}
        </div>
      )}

      {/* Track */}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          'bg-slate-200 dark:bg-slate-700',
          trackHeights[size] ?? trackHeights.md,
        )}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% complete`}
      >
        {/* Fill */}
        <div
          className={cn(
            'h-full rounded-full',
            'transition-[width] duration-500 ease-out',
            barColor,
            // Pulse only on 100%
            isComplete && animated && 'animate-pulse',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
