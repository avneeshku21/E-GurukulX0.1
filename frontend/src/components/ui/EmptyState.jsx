// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – EmptyState Component
// ─────────────────────────────────────────────────────────────────────────────

import { cn } from '../../lib/utils.js';
import Button from './Button.jsx';

// Default illustration shown when no custom icon is provided
function DefaultIllustration() {
  return (
    <svg
      className="w-20 h-20 text-slate-300 dark:text-slate-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 80 80"
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
      <path d="M28 40h24M40 28v24" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" />
    </svg>
  );
}

/**
 * EmptyState
 *
 * @param {React.ReactNode} icon         - Custom SVG / emoji / React node (optional)
 * @param {string}          title
 * @param {string}          description
 * @param {string}          actionLabel  - Text for the CTA button (omit to hide button)
 * @param {function}        onAction     - Click handler for the CTA button
 */
export default function EmptyState({
  icon,
  title       = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-16 px-6 gap-4',
        className,
      )}
    >
      {/* Icon / Illustration */}
      <div className="mb-2">
        {icon ?? <DefaultIllustration />}
      </div>

      {/* Text */}
      <div className="max-w-xs space-y-1.5">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action */}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
