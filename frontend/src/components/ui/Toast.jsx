// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Toast Utility
// Thin wrapper around Sonner with EduTrack-branded default styles.
// Import and call toast.success() / toast.error() / etc. anywhere in the app.
// ─────────────────────────────────────────────────────────────────────────────

import { toast as sonner } from 'sonner';

const baseOptions = {
  duration: 4000,
};

const toast = {
  /**
   * @param {string} message
   * @param {import('sonner').ToastOptions} [options]
   */
  success(message, options) {
    return sonner.success(message, {
      ...baseOptions,
      style: {
        '--normal-bg':     '#f0fdf4',
        '--normal-text':   '#166534',
        '--normal-border': '#bbf7d0',
      },
      ...options,
    });
  },

  /**
   * @param {string} message
   * @param {import('sonner').ToastOptions} [options]
   */
  error(message, options) {
    return sonner.error(message, {
      ...baseOptions,
      style: {
        '--normal-bg':     '#fef2f2',
        '--normal-text':   '#991b1b',
        '--normal-border': '#fecaca',
      },
      ...options,
    });
  },

  /**
   * @param {string} message
   * @param {import('sonner').ToastOptions} [options]
   */
  warning(message, options) {
    return sonner.warning(message, {
      ...baseOptions,
      style: {
        '--normal-bg':     '#fffbeb',
        '--normal-text':   '#92400e',
        '--normal-border': '#fde68a',
      },
      ...options,
    });
  },

  /**
   * @param {string} message
   * @param {import('sonner').ToastOptions} [options]
   */
  info(message, options) {
    return sonner.message(message, {
      ...baseOptions,
      style: {
        '--normal-bg':     '#eff6ff',
        '--normal-text':   '#1e40af',
        '--normal-border': '#bfdbfe',
      },
      ...options,
    });
  },

  /** Dismiss a specific or all toasts */
  dismiss: sonner.dismiss.bind(sonner),

  /** Show a loading toast (returns id so you can update it) */
  loading: sonner.loading.bind(sonner),

  /** Update a toast created with toast.loading() */
  promise: sonner.promise.bind(sonner),
};

export default toast;
