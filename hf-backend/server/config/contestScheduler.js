// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Contest Cron Scheduler
// Fetches contests every hour and updates statuses every 5 minutes
// ─────────────────────────────────────────────────────────────────────────────

import cron from 'node-cron';
import Contest from '../models/Contest.model.js';
import { fetchAndStoreContests } from '../services/contest.service.js';

export function startContestScheduler() {
  // ── Fetch new contests from APIs every hour ─────────────────────────────
  cron.schedule('0 * * * *', async () => {
    console.log('[cron] Fetching contests from APIs...');
    try {
      await fetchAndStoreContests();
    } catch (err) {
      console.error('[cron] Contest fetch error:', err.message);
    }
  });

  // ── Update contest statuses (live/ended) every 5 minutes ────────────────
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      const [liveResult, endedResult, upcomingResult] = await Promise.all([
        // Mark started contests as live
        Contest.updateMany(
          { startTime: { $lte: now }, endTime: { $gte: now }, status: 'upcoming' },
          { $set: { status: 'live' } },
        ),
        // Mark finished contests as ended
        Contest.updateMany(
          { endTime: { $lt: now }, status: { $ne: 'ended' } },
          { $set: { status: 'ended' } },
        ),
        // Ensure future contests are marked upcoming (guard against data issues)
        Contest.updateMany(
          { startTime: { $gt: now }, status: 'live' },
          { $set: { status: 'upcoming' } },
        ),
      ]);
      const changed = liveResult.modifiedCount + endedResult.modifiedCount + upcomingResult.modifiedCount;
      if (changed > 0) console.log(`[cron] Updated ${changed} contest status(es)`);
    } catch (err) {
      console.error('[cron] Status update error:', err.message);
    }
  });

  console.log('✅  Contest scheduler started (fetch: hourly, status update: every 5 min)');
}
