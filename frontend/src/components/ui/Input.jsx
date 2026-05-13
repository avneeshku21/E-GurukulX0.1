// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Input Component
// ─────────────────────────────────────────────────────────────────────────────

import { useState, forwardRef, useId } from 'react';
import { cn } from '../../lib/utils.js';

// Inline SVG eye icons (avoids adding an icon library dependency for a single pair)
function EyeIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function EyeOffIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

/**
 * Input
 *
 * @param {string}  label
 * @param {string}  error       - Validation error message (shows red border + text)
 * @param {string}  helperText  - Hint shown below input (hidden when error is set)
 * @param {React.ReactNode} leftIcon
 * @param {React.ReactNode} rightIcon  - Ignored when type="password" (eye toggle takes its place)
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    type = 'text',
    className,
    id: externalId,
    ...rest
  },
  ref,
) {
  const generatedId                 = useId();
  const id                          = externalId ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);

  const isPassword  = type === 'password';
  const inputType   = isPassword ? (showPassword ? 'text' : 'password') : type;
  const hasError    = !!error;

  const inputClasses = cn(
    'peer w-full rounded-[var(--radius)] border bg-white dark:bg-slate-900',
    'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'text-sm py-2.5 transition-colors duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    // Horizontal padding accounts for optional icons
    leftIcon   ? 'pl-9'  : 'pl-3.5',
    (isPassword || rightIcon) ? 'pr-9' : 'pr-3.5',
    // Border / ring colours
    hasError
      ? 'border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-red-400/30'
      : 'border-slate-300 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-400/30',
    className,
  );

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium',
            hasError ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300',
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Left icon */}
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          type={inputType}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : helperText ? `${id}-hint` : undefined}
          {...rest}
        />

        {/* Password toggle  /  right icon */}
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword
              ? <EyeOffIcon className="h-4 w-4" />
              : <EyeIcon    className="h-4 w-4" />
            }
          </button>
        ) : rightIcon ? (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {/* Error message */}
      {hasError && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Helper text (only shown when no error) */}
      {!hasError && helperText && (
        <p id={`${id}-hint`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
