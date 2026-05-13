// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Shared Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

import { clsx }   from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ── Class name merger ─────────────────────────────────────────────────────────

/**
 * Merge Tailwind classes safely, resolving conflicts.
 * @param {...(string|undefined|null|false)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return twMerge(clsx(classes));
}

// ── Duration formatting ───────────────────────────────────────────────────────

/**
 * Format seconds to a human-readable duration string.
 * @param {number} seconds
 * @returns {string}  "4h 32m" | "45m 30s"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0m 0s';

  const totalSecs = Math.floor(Number(seconds));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// ── View count formatting ─────────────────────────────────────────────────────

/**
 * Format a large number to a compact string.
 * @param {number|bigint|string} n
 * @returns {string}  "1.2M" | "45K" | "999"
 */
export function formatViewCount(n) {
  const num = typeof n === 'bigint' ? Number(n) : Number(n);
  if (isNaN(num) || num < 0) return '0';

  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${val}M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${val}K`;
  }
  return String(num);
}

// ── Date formatting ───────────────────────────────────────────────────────────

/**
 * Format a date string to "Jan 15, 2026".
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

// ── Relative time ─────────────────────────────────────────────────────────────

/**
 * Format a date string to a relative time string.
 * @param {string|Date} dateStr
 * @returns {string}  "2 hours ago" | "3 days ago"
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
}

// ── String truncation ─────────────────────────────────────────────────────────

/**
 * Truncate a string to `max` characters, appending "…" if cut.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
export function truncate(str, max) {
  if (!str) return '';
  if (str.length <= max) return str;
  return `${str.slice(0, max)}...`;
}

// ── Slug generation ───────────────────────────────────────────────────────────

/**
 * Convert a string to a URL-safe slug.
 * @param {string} str
 * @returns {string}  "My Course Title" → "my-course-title"
 */
export function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Progress colors ───────────────────────────────────────────────────────────

/**
 * Get the Tailwind background color class for a progress percentage.
 * @param {number} percent  0–100
 * @returns {string}
 */
export function getProgressColor(percent) {
  const p = Number(percent) || 0;
  if (p === 100) return 'bg-green-500';
  if (p >= 67)   return 'bg-blue-500';
  if (p >= 34)   return 'bg-amber-500';
  return 'bg-red-500';
}

/**
 * Get the Tailwind text color class for a progress percentage.
 * @param {number} percent  0–100
 * @returns {string}
 */
export function getProgressTextColor(percent) {
  const p = Number(percent) || 0;
  if (p === 100) return 'text-green-500';
  if (p >= 67)   return 'text-blue-500';
  if (p >= 34)   return 'text-amber-500';
  return 'text-red-500';
}

// ── Initials ──────────────────────────────────────────────────────────────────

/**
 * Generate 1–2 uppercase initials from a full name.
 * @param {string} name  "John Doe"
 * @returns {string}     "JD"
 */
export function generateInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

// ── File validation ───────────────────────────────────────────────────────────

/**
 * Check whether a File is a valid avatar upload.
 * Accepted: JPEG / PNG, max 2 MB.
 * @param {File} file
 * @returns {boolean}
 */
export function isValidImageFile(file) {
  if (!file) return false;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize      = 2 * 1024 * 1024; // 2 MB
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

// ── BigInt serialiser ─────────────────────────────────────────────────────────

/**
 * Recursively convert BigInt values to strings so the object is JSON-safe.
 * Prisma returns BigInt for view / like counts.
 * @param {*} obj
 * @returns {*}
 */
export function serializeBigInt(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value,
    ),
  );
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

/**
 * Async sleep helper.
 * @param {number} ms  Milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
