// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Streak Calculator
// server/utils/streakCalculator.js
// ─────────────────────────────────────────────────────────────────────────────

import { subDays, format, parseISO, isEqual } from 'date-fns';

/**
 * toUtcDateString — converts any Date (or ISO string) to a UTC YYYY-MM-DD string.
 *
 * @param {Date|string} date
 * @returns {string} e.g. "2026-05-07"
 */
function toUtcDateString(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * calculateStreak
 *
 * Determines the updated streak state for a user who just had activity today.
 *
 * Rules:
 *  - No previous activity   → streak = 1
 *  - Activity was today     → no change (already counted today)
 *  - Activity was yesterday → streak + 1
 *  - Activity was older     → streak resets to 1
 *  - longestStreak is updated if currentStreak exceeds it
 *
 * @param {Date|string|null} lastActiveDate   - Last recorded activity date (UTC)
 * @param {number}           currentStreak    - Current consecutive-day streak
 * @param {number}           longestStreak    - All-time longest streak
 *
 * @returns {{
 *   currentStreak:  number,
 *   longestStreak:  number,
 *   lastActiveDate: string,   // UTC YYYY-MM-DD
 *   streakChanged:  boolean,  // true if currentStreak was incremented
 * }}
 */
export function calculateStreak(lastActiveDate, currentStreak, longestStreak) {
  const today = toUtcDateString(new Date());

  // ── Case 1: No prior activity — start a fresh streak ──────────────────────
  if (lastActiveDate === null || lastActiveDate === undefined) {
    const newStreak = 1;
    return {
      currentStreak:  newStreak,
      longestStreak:  Math.max(newStreak, longestStreak),
      lastActiveDate: today,
      streakChanged:  true,
    };
  }

  const lastActive = toUtcDateString(
    typeof lastActiveDate === 'string' ? lastActiveDate : lastActiveDate,
  );

  // ── Case 2: Already active today — no change ──────────────────────────────
  if (lastActive === today) {
    return {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      streakChanged:  false,
    };
  }

  // ── Case 3: Active yesterday — extend streak ──────────────────────────────
  const yesterdayDate = subDays(
    // Parse as local midnight to use date-fns day arithmetic correctly
    parseISO(today),
    1,
  );
  const yesterday = format(yesterdayDate, 'yyyy-MM-dd');

  if (lastActive === yesterday) {
    const newStreak = currentStreak + 1;
    return {
      currentStreak:  newStreak,
      longestStreak:  Math.max(newStreak, longestStreak),
      lastActiveDate: today,
      streakChanged:  true,
    };
  }

  // ── Case 4: Gap detected — reset to 1 ────────────────────────────────────
  const newStreak = 1;
  return {
    currentStreak:  newStreak,
    longestStreak:  Math.max(newStreak, longestStreak),
    lastActiveDate: today,
    streakChanged:  true,
  };
}

/**
 * isStreakAtRisk
 *
 * Returns true if the user has NOT been active today and their streak
 * will break if they don't log activity before midnight UTC.
 * Used to show "Your streak is at risk!" warnings in the dashboard.
 *
 * @param {Date|string|null} lastActiveDate
 * @param {number} currentStreak
 * @returns {boolean}
 */
export function isStreakAtRisk(lastActiveDate, currentStreak) {
  if (!lastActiveDate || currentStreak === 0) return false;

  const today      = toUtcDateString(new Date());
  const lastActive = toUtcDateString(
    typeof lastActiveDate === 'string' ? new Date(lastActiveDate) : lastActiveDate,
  );

  // Streak is at risk only if last activity was yesterday (not today)
  const yesterday = format(subDays(parseISO(today), 1), 'yyyy-MM-dd');
  return lastActive === yesterday;
}
