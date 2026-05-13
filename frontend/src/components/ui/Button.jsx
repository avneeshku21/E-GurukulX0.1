// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Button Component
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';

const variantClasses = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 ' +
    'focus-visible:ring-indigo-500 shadow-sm hover:shadow-indigo-200 dark:hover:shadow-indigo-900',
  secondary:
    'bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 ' +
    'focus-visible:ring-violet-500 shadow-sm',
  outline:
    'border border-slate-300 dark:border-slate-600 bg-transparent ' +
    'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 ' +
    'focus-visible:ring-slate-400',
  ghost:
    'bg-transparent text-slate-700 dark:text-slate-200 ' +
    'hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 ' +
    'focus-visible:ring-red-500 shadow-sm',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 ' +
    'focus-visible:ring-emerald-500 shadow-sm',
};

const sizeClasses = {
  xs: 'text-xs  px-2   py-1    gap-1   h-7',
  sm: 'text-sm  px-3   py-1.5  gap-1.5 h-8',
  md: 'text-sm  px-4   py-2    gap-2   h-10',
  lg: 'text-base px-6  py-3    gap-2   h-12',
};

// Minimal inline SVG spinner that matches button text color
function ButtonSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * Button
 *
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'|'success'} variant
 * @param {'xs'|'sm'|'md'|'lg'} size
 * @param {boolean} isLoading
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon
 */
export default function Button({
  variant   = 'primary',
  size      = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...rest
}) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-[var(--radius)]',
        'transition-all duration-150 select-none whitespace-nowrap',
        // Focus ring
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        // Disabled
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantClasses[variant] ?? variantClasses.primary,
        sizeClasses[size]       ?? sizeClasses.md,
        className,
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <ButtonSpinner />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {leftIcon  && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
