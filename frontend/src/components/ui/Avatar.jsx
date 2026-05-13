// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Avatar Component
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { cn, generateInitials } from '../../lib/utils.js';

const sizeClasses = {
  xs: 'w-6   h-6   text-[10px]',
  sm: 'w-8   h-8   text-xs',
  md: 'w-10  h-10  text-sm',
  lg: 'w-12  h-12  text-base',
  xl: 'w-16  h-16  text-xl',
};

const onlineDotSizes = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2   h-2   border',
  md: 'w-2.5 h-2.5 border-[1.5px]',
  lg: 'w-3   h-3   border-2',
  xl: 'w-4   h-4   border-2',
};

// Deterministic background color from name string
const BG_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-emerald-500',
];

function getColorFromName(name) {
  if (!name) return BG_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BG_COLORS[Math.abs(hash) % BG_COLORS.length];
}

/**
 * Avatar
 *
 * @param {string}                    src     - Image URL. Falls back to initials if omitted or broken.
 * @param {string}                    name    - Used to generate initials and background color.
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} size
 * @param {boolean}                   online  - Show green online indicator dot.
 */
export default function Avatar({
  src,
  name,
  size    = 'md',
  online  = false,
  className,
  ...rest
}) {
  const [imgError, setImgError] = useState(false);

  const showImage    = src && !imgError;
  const initials     = generateInitials(name);
  const bgColor      = getColorFromName(name);

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...rest}>
      {showImage ? (
        <img
          src={src}
          alt={name ?? 'User avatar'}
          onError={() => setImgError(true)}
          className={cn(
            'rounded-full object-cover object-center',
            sizeClasses[size] ?? sizeClasses.md,
          )}
          draggable={false}
        />
      ) : (
        <span
          aria-label={name ?? 'User avatar'}
          className={cn(
            'rounded-full flex items-center justify-center',
            'font-semibold text-white select-none',
            bgColor,
            sizeClasses[size] ?? sizeClasses.md,
          )}
        >
          {initials}
        </span>
      )}

      {/* Online dot */}
      {online && (
        <span
          aria-label="Online"
          className={cn(
            'absolute bottom-0 right-0 rounded-full',
            'bg-emerald-500 border-white dark:border-slate-900',
            onlineDotSizes[size] ?? onlineDotSizes.md,
          )}
        />
      )}
    </div>
  );
}
