// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – StatsCard  (animated count-up on mount)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { cn } from '../lib/utils.js';

const UpArrowIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M5 15l7-7 7 7" />
  </svg>
);
const DownArrowIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
  </svg>
);

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const numericTarget = typeof target === 'number' ? target : parseFloat(target) || 0;
    if (numericTarget === 0) return;

    const startTime = performance.now();

    const tick = (now) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased    = 1 - Math.pow(1 - progress, 2);
      setCount(Math.floor(eased * numericTarget));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setCount(numericTarget);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

const colorConfig = {
  indigo:  { ring: 'bg-indigo-100 dark:bg-indigo-950',  icon: 'text-indigo-600 dark:text-indigo-400'  },
  violet:  { ring: 'bg-violet-100 dark:bg-violet-950',  icon: 'text-violet-600 dark:text-violet-400'  },
  green:   { ring: 'bg-emerald-100 dark:bg-emerald-950', icon: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { ring: 'bg-amber-100 dark:bg-amber-950',    icon: 'text-amber-600 dark:text-amber-400'    },
  blue:    { ring: 'bg-blue-100 dark:bg-blue-950',      icon: 'text-blue-600 dark:text-blue-400'      },
  red:     { ring: 'bg-red-100 dark:bg-red-950',        icon: 'text-red-600 dark:text-red-400'        },
};

/**
 * StatsCard
 *
 * @param {React.ReactNode} icon     - Icon node rendered inside the colored circle
 * @param {string}  label            - e.g. "Total Videos"
 * @param {number}  value            - Numeric value (will animate count-up)
 * @param {string}  [subtitle]       - Secondary text below value
 * @param {number}  [trend]          - e.g. 12.5 (positive = green up, negative = red down)
 * @param {'indigo'|'violet'|'green'|'amber'|'blue'|'red'} [color]
 * @param {string}  [suffix]         - Appended to value e.g. "%", "d"
 */
export default function StatsCard({
  icon,
  label,
  value     = 0,
  subtitle,
  trend,
  color     = 'indigo',
  suffix    = '',
  className,
}) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);
  const { ring, icon: iconColor } = colorConfig[color] ?? colorConfig.indigo;

  const displayValue =
    typeof value === 'number'
      ? animatedValue.toLocaleString() + suffix
      : String(value);

  const hasTrend    = trend !== undefined && trend !== null;
  const isPositive  = trend > 0;

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-5 rounded-xl',
        'border border-slate-200 dark:border-slate-800',
        'bg-white dark:bg-slate-900',
        'shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        className,
      )}
    >
      {/* Icon circle */}
      {icon && (
        <div className={cn('flex items-center justify-center w-11 h-11 rounded-xl shrink-0', ring)}>
          <span className={cn('text-xl leading-none', iconColor)}>{icon}</span>
        </div>
      )}

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
          {label}
        </p>

        <div className="flex items-end gap-2 flex-wrap">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50 tabular-nums leading-tight">
            {displayValue}
          </p>

          {hasTrend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-semibold pb-0.5',
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400',
              )}
            >
              {isPositive ? <UpArrowIcon /> : <DownArrowIcon />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
