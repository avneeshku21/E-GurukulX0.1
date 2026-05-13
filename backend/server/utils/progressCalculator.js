// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Progress Calculator
// server/utils/progressCalculator.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * calculateProgress
 *
 * Computes the percentage of a playlist that has been completed.
 * Returns 0 when totalVideos is 0 to avoid division by zero.
 * The result is rounded to the nearest integer and clamped to [0, 100].
 *
 * @param {number} completedCount  - Number of videos marked as completed
 * @param {number} totalVideos     - Total videos in the playlist
 * @returns {number} - Integer percentage 0–100
 */
export function calculateProgress(completedCount, totalVideos) {
  if (totalVideos === 0) return 0;
  const raw = (completedCount / totalVideos) * 100;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

/**
 * getProgressStatus
 *
 * Returns a semantic status string based on the completion percentage.
 *
 * | percent | status        |
 * |---------|---------------|
 * | 0       | 'not-started' |
 * | 1–99    | 'in-progress' |
 * | 100     | 'completed'   |
 *
 * @param {number} percent - Integer 0–100
 * @returns {'not-started' | 'in-progress' | 'completed'}
 */
export function getProgressStatus(percent) {
  if (percent === 0)   return 'not-started';
  if (percent === 100) return 'completed';
  return 'in-progress';
}

/**
 * getProgressColor
 *
 * Maps a progress percentage to a Tailwind-compatible color name used
 * for progress bar and badge styling.
 *
 * | range   | color   | Tailwind class example   |
 * |---------|---------|--------------------------|
 * | 0–33    | 'red'   | bg-red-500               |
 * | 34–66   | 'amber' | bg-amber-500             |
 * | 67–99   | 'blue'  | bg-blue-500              |
 * | 100     | 'green' | bg-green-500             |
 *
 * @param {number} percent - Integer 0–100
 * @returns {'red' | 'amber' | 'blue' | 'green'}
 */
export function getProgressColor(percent) {
  if (percent <= 33)  return 'red';
  if (percent <= 66)  return 'amber';
  if (percent <= 99)  return 'blue';
  return 'green';
}

/**
 * getProgressMeta
 *
 * Convenience function that returns all three computed values at once.
 * Useful when a single call is preferable to three separate calls.
 *
 * @param {number} completedCount
 * @param {number} totalVideos
 * @returns {{
 *   percent: number,
 *   status:  'not-started' | 'in-progress' | 'completed',
 *   color:   'red' | 'amber' | 'blue' | 'green',
 * }}
 */
export function getProgressMeta(completedCount, totalVideos) {
  const percent = calculateProgress(completedCount, totalVideos);
  return {
    percent,
    status: getProgressStatus(percent),
    color:  getProgressColor(percent),
  };
}
