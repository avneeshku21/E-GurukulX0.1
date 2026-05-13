// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Contest Routes
// Mounted at: /api/contests
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import mongoose   from 'mongoose';
import Contest      from '../models/Contest.model.js';
import SavedContest from '../models/SavedContest.model.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { fetchAndStoreContests } from '../services/contest.service.js';

const router = Router();

// Coding-interest slugs that unlock the Contests section
const CODING_SLUGS = new Set([
  'programming', 'web-development', 'data-science',
  'computer-science', 'dsa', 'coding', 'development',
]);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contests
// Query: status, type, platform, difficulty, search, tags, page, limit
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const {
      status,
      type,
      platform,
      difficulty,
      search,
      tags,
      page  = '1',
      limit = '20',
      sort  = 'startTime',
    } = req.query;

    const filter = {};
    if (status && status !== 'all')     filter.status     = status;
    if (type   && type   !== 'all')     filter.type       = type;
    if (platform && platform !== 'all') filter.platform   = platform.toLowerCase().replace(/-/g, '_');
    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (search) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: re }, { platformLabel: re }, { description: re }, { tags: re }];
    }

    // By default exclude ended contests unless explicitly requested
    if (!filter.status) {
      filter.status = { $in: ['upcoming', 'live'] };
    }

    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * pageSize;

    const sortField = sort === 'startTime' ? { status: -1, startTime: 1 } : { [sort]: -1 };

    const [contests, total] = await Promise.all([
      Contest.find(filter).sort(sortField).skip(skip).limit(pageSize).lean(),
      Contest.countDocuments(filter),
    ]);

    // Attach saved status for current user
    const contestIds = contests.map(c => c._id);
    const saved = await SavedContest.find({ userId: req.user.id, contestId: { $in: contestIds } })
      .select('contestId reminder participated').lean();
    const savedMap = {};
    for (const s of saved) savedMap[s.contestId.toString()] = s;

    const enriched = contests.map(c => ({
      ...c,
      id: c._id.toString(),
      isSaved:      !!savedMap[c._id.toString()],
      hasReminder:  savedMap[c._id.toString()]?.reminder ?? false,
      participated: savedMap[c._id.toString()]?.participated ?? false,
    }));

    return sendSuccess(res, {
      contests: enriched,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: pageNum * pageSize < total,
      },
    }, 'Contests fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contests/stats  — live/upcoming/hackathon counts for dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const [live, upcoming, hackathons, savedCount] = await Promise.all([
      Contest.countDocuments({ status: 'live' }),
      Contest.countDocuments({ status: 'upcoming' }),
      Contest.countDocuments({ type: 'hackathon', status: { $in: ['live', 'upcoming'] } }),
      SavedContest.countDocuments({ userId: req.user.id }),
    ]);
    return sendSuccess(res, { live, upcoming, hackathons, saved: savedCount });
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contests/platforms  — distinct platforms present in the DB
// Returns only platforms that actually have live/upcoming contests
// ─────────────────────────────────────────────────────────────────────────────
router.get('/platforms', verifyToken, async (req, res, next) => {
  try {
    const platforms = await Contest.aggregate([
      { $match: { status: { $in: ['live', 'upcoming'] } } },
      {
        $group: {
          _id:   '$platform',
          label: { $first: '$platformLabel' },
          logo:  { $first: '$platformLogo' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $project: { _id: 0, platform: '$_id', label: 1, logo: 1, count: 1 } },
    ]);
    return sendSuccess(res, { platforms });
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contests/saved  — current user's saved/bookmarked contests
// ─────────────────────────────────────────────────────────────────────────────
router.get('/saved', verifyToken, async (req, res, next) => {
  try {
    const saved = await SavedContest.find({ userId: req.user.id })
      .populate('contestId')
      .sort({ createdAt: -1 })
      .lean();
    const result = saved
      .filter(s => s.contestId)
      .map(s => ({
        ...s.contestId,
        id: s.contestId._id.toString(),
        isSaved: true,
        hasReminder: s.reminder,
        participated: s.participated,
        savedAt: s.createdAt,
      }));
    return sendSuccess(res, { contests: result }, 'Saved contests fetched.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contests/:id/save   — bookmark a contest
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/save', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid contest ID.', 400);

    const contest = await Contest.findById(id).lean();
    if (!contest) return sendError(res, 'Contest not found.', 404);

    await SavedContest.updateOne(
      { userId: req.user.id, contestId: id },
      { $set: { userId: req.user.id, contestId: id } },
      { upsert: true },
    );
    return sendSuccess(res, null, 'Contest saved.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/contests/:id/save  — remove bookmark
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id/save', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid contest ID.', 400);
    await SavedContest.deleteOne({ userId: req.user.id, contestId: id });
    return sendSuccess(res, null, 'Contest removed from saved.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/contests/:id/reminder  — toggle reminder on a saved contest
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/reminder', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reminder = true, minutesBefore = 30 } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid contest ID.', 400);

    // Ensure contest is saved first
    await SavedContest.updateOne(
      { userId: req.user.id, contestId: id },
      { $set: { userId: req.user.id, contestId: id, reminder, reminderMinutesBefore: minutesBefore } },
      { upsert: true },
    );
    return sendSuccess(res, { reminder, minutesBefore }, reminder ? 'Reminder set.' : 'Reminder removed.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/contests/:id/participated  — mark as participated
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/participated', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid contest ID.', 400);

    await SavedContest.updateOne(
      { userId: req.user.id, contestId: id },
      { $set: { userId: req.user.id, contestId: id, participated: true } },
      { upsert: true },
    );
    return sendSuccess(res, null, 'Marked as participated.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contests/refresh  — manual trigger to re-fetch from APIs (admin)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/refresh', verifyToken, async (req, res, next) => {
  try {
    const result = await fetchAndStoreContests();
    return sendSuccess(res, result, 'Contest data refreshed from APIs.');
  } catch (err) {
    return next(err);
  }
});

export default router;
