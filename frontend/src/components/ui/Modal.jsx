// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Modal Component
// Features: portal, backdrop, Escape key, focus trap, scale+fade animation
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/utils.js';

// Inline X icon
function XIcon({ className }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Modal
 *
 * @param {boolean}                        isOpen
 * @param {() => void}                     onClose
 * @param {string}                         title
 * @param {'sm'|'md'|'lg'|'xl'|'full'}    size
 * @param {boolean}                        closeOnBackdrop  - default true
 * @param {React.ReactNode}                children
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  size             = 'md',
  closeOnBackdrop  = true,
  children,
  className,
}) {
  const dialogRef  = useRef(null);
  const previousFocusRef = useRef(null);

  // ── Focus trap ───────────────────────────────────────────────────────────

  const trapFocus = useCallback((e) => {
    if (!dialogRef.current) return;
    const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTORS)];
    if (!focusable.length) return;

    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    }
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return;

    // Save the element that had focus before modal opened
    previousFocusRef.current = document.activeElement;

    // Move focus into the dialog
    const firstFocusable = dialogRef.current?.querySelector(FOCUSABLE_SELECTORS);
    (firstFocusable ?? dialogRef.current)?.focus();

    // Prevent body scroll
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
      // Restore focus on close
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
      trapFocus(e);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, trapFocus]);

  if (!isOpen) return null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={cn(
          // Positioning + sizing
          'relative z-10 w-full flex flex-col',
          'max-h-[90vh]',
          sizeClasses[size] ?? sizeClasses.md,
          // Visual
          'rounded-xl bg-white dark:bg-slate-900',
          'border border-slate-200 dark:border-slate-700',
          'shadow-2xl',
          // Entry animation
          'animate-[scale-in_0.15s_ease-out,fade-in_0.15s_ease-out]',
          className,
        )}
        // Prevent backdrop click from propagating through dialog
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h2
              id="modal-title"
              className="text-base font-semibold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body – scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
