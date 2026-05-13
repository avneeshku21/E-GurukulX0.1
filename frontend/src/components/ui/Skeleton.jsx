// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Skeleton Component
// Shimmer loading placeholder. Uses animate-shimmer defined in index.css.
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';

const variantClasses = {
  text:        'rounded',
  circular:    'rounded-full',
  rectangular: 'rounded-[var(--radius)]',
};

const textDefaults = {
  height: '1em',
  width:  '100%',
};

/**
 * Skeleton
 *
 * @param {'text'|'circular'|'rectangular'} variant
 * @param {string|number} width    - CSS width (e.g. '200px', '100%', 40)
 * @param {string|number} height   - CSS height
 * @param {number}        count    - Render N skeletons stacked vertically
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  count   = 1,
  className,
  ...rest
}) {
  const style = {
    width:  width  ?? (variant === 'text' ? textDefaults.width  : undefined),
    height: height ?? (variant === 'text' ? textDefaults.height : undefined),
  };

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {items.map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            'block animate-shimmer',
            variantClasses[variant] ?? variantClasses.text,
            count > 1 && i < count - 1 && 'mb-2',
            className,
          )}
          style={style}
          {...rest}
        />
      ))}
    </>
  );
}

// ── Preset composite skeletons ─────────────────────────────────────────────

/** Card-shaped skeleton */
export function SkeletonCard({ className }) {
  return (
    <div className={cn('p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3', className)}>
      <Skeleton variant="rectangular" height={160} />
      <Skeleton variant="text" width="70%" height="1.1em" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="50%" />
    </div>
  );
}

/** Avatar + lines */
export function SkeletonUser({ className }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" height="0.9em" />
        <Skeleton variant="text" width="60%" height="0.75em" />
      </div>
    </div>
  );
}

export default Skeleton;
