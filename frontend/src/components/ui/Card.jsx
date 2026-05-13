// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Card Component (and sub-components)
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';

const paddingVariants = {
  none:   '',
  sm:     'p-4',
  md:     'p-5',
  lg:     'p-6',
  xl:     'p-8',
};

/**
 * Card
 *
 * @param {boolean}                        hover    - Add hover shadow + lift on hover
 * @param {'none'|'sm'|'md'|'lg'|'xl'}    padding  - Inner padding preset (applied to Card itself when not using CardContent)
 */
export function Card({ hover = false, padding = 'none', className, children, ...rest }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 dark:border-slate-800',
        'bg-white dark:bg-slate-900',
        'shadow-sm',
        hover && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        paddingVariants[padding],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * CardHeader – top section with optional bottom border
 */
export function CardHeader({ className, children, withDivider = false, ...rest }) {
  return (
    <div
      className={cn(
        'px-5 py-4',
        withDivider && 'border-b border-slate-100 dark:border-slate-800',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle – h3-level heading inside CardHeader
 */
export function CardTitle({ className, children, ...rest }) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight',
        className,
      )}
      {...rest}
    >
      {children}
    </h3>
  );
}

/**
 * CardDescription – muted subtitle inside CardHeader
 */
export function CardDescription({ className, children, ...rest }) {
  return (
    <p
      className={cn('text-sm text-slate-500 dark:text-slate-400 mt-0.5', className)}
      {...rest}
    >
      {children}
    </p>
  );
}

/**
 * CardContent – the main body area
 */
export function CardContent({ className, children, ...rest }) {
  return (
    <div className={cn('px-5 py-4', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * CardFooter – bottom section, typically for actions
 */
export function CardFooter({ className, children, ...rest }) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-t border-slate-100 dark:border-slate-800',
        'flex items-center gap-3',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

// Convenience default export
export default Card;
