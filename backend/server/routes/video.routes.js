// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Video Routes
// server/routes/video.routes.js
// Mounted at: /api/videos
// ─────────────────────────────────────────────────────────────────────────────

import { Router }   from 'express';
import User         from '../models/User.model.js';
import Category     from '../models/Category.model.js';
import { optionalAuth, verifyToken } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError, sendPaginated, buildPagination } from '../utils/response.js';
import {
  searchVideos,
  searchEducationalVideos,
  getTopViewedEducationalVideos,
  getLatestEducationalVideos,
  getVideoById,
} from '../services/youtube.service.js';

const router = Router();

const VIDEOS_PER_PAGE = 12;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/videos/discovery  (verifyToken)
// Returns top-viewed + latest + all categories for the discovery page
// ─────────────────────────────────────────────────────────────────────────────

router.get('/discovery', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate('categoryIds').lean();

    const userCategories   = (user?.categoryIds ?? []);
    const primaryCategory  = userCategories[0] ?? { youtubeQuery: 'programming tutorial', name: 'Programming' };

    const [topViewed, latest, allCategories] = await Promise.all([
      getTopViewedEducationalVideos(primaryCategory.youtubeQuery),
      getLatestEducationalVideos(primaryCategory.youtubeQuery),
      Category.find({ isActive: true }).sort({ name: 1 }).lean(),
    ]);

    return sendSuccess(res, {
      topViewedVideos:  topViewed.videos,
      latestVideos:     latest.videos,
      userCategories,
      allCategories,
      featuredCategory: primaryCategory,
    }, 'Discovery data fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/videos/search  (verifyToken)
// Query params: q, sortBy, duration, pageToken, category
// ─────────────────────────────────────────────────────────────────────────────

router.get('/search', verifyToken, async (req, res, next) => {
  try {
    const { q, sortBy = 'relevance', duration = 'any', pageToken, category } = req.query;

    const trimmedQ = q ? String(q).trim() : '';

    // Require at least a query OR a category
    if (!trimmedQ && !category) {
      return sendError(res, 'Provide a search query or select a category.', 400);
    }

    let searchQuery = trimmedQ;

    // If category provided, augment query with category's youtubeQuery
    if (category) {
      const cat = await Category.findOne({ slug: String(category) }).lean();
      // Use DB youtubeQuery if available; otherwise fall back to the slug as a keyword
      const categoryKeyword = cat ? cat.youtubeQuery : String(category).replace(/-/g, ' ');
      searchQuery = trimmedQ ? `${categoryKeyword} ${trimmedQ}` : categoryKeyword;
    }

    // Fallback: still need something to search
    if (!searchQuery) {
      return sendError(res, 'Search query must not be empty.', 400);
    }

    const results = await searchEducationalVideos(searchQuery, { sortBy, duration, pageToken });

    return sendSuccess(res, {
      videos:         results.videos,
      nextPageToken:  results.nextPageToken,
      totalResults:   results.totalResults,
      query:          q,
    }, 'Search results fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/videos/category/:slug  (verifyToken)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/category/:slug', verifyToken, async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug }).lean();
    if (!category) return sendError(res, 'Category not found.', 404);

    const [topViewed, latest] = await Promise.all([
      getTopViewedEducationalVideos(category.youtubeQuery),
      getLatestEducationalVideos(category.youtubeQuery),
    ]);

    return sendSuccess(res, {
      category,
      topViewedVideos: topViewed.videos,
      latestVideos:    latest.videos,
    }, 'Category videos fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/videos  (optionalAuth)
// Query params: category (slug), search, duration, date, page
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category = '',
      search   = '',
      duration = '',   // 'short' | 'medium' | 'long'
      date     = '',   // 'today' | 'week' | 'month' | 'year'
      page     = '1',
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    // ── 1. Resolve category from DB ────────────────────────────────────────
    let ytQuery      = 'programming tutorial';
    let categoryId   = '';
    let categoryRecord = null;

    if (category) {
      categoryRecord = await Category.findOne({ slug: String(category) }).lean();
      if (!categoryRecord || !categoryRecord.isActive) {
        return sendError(res, `Category "${category}" not found.`, 404);
      }
      ytQuery    = categoryRecord.youtubeQuery;
      categoryId = categoryRecord._id.toString();
    }

    // ── 2. Build final search query ────────────────────────────────────────
    const fullQuery = search
      ? `${ytQuery} ${String(search).trim()}`
      : ytQuery;

    // ── 3. Fetch from YouTube (with cache) ─────────────────────────────────
    let videos = await searchVideos(fullQuery, categoryId, { maxResults: 50 });

    // ── 4. Duration filter ─────────────────────────────────────────────────
    if (duration) {
      videos = videos.filter((v) => {
        const s = v.durationSeconds;
        if (duration === 'short')  return s > 0   && s < 240;
        if (duration === 'medium') return s >= 240 && s <= 1200;
        if (duration === 'long')   return s > 1200;
        return true;
      });
    }

    // ── 5. Date filter ─────────────────────────────────────────────────────
    if (date) {
      const now = Date.now();
      const thresholds = {
        today: now - 24 * 60 * 60 * 1000,
        week:  now - 7  * 24 * 60 * 60 * 1000,
        month: now - 30 * 24 * 60 * 60 * 1000,
        year:  now - 365 * 24 * 60 * 60 * 1000,
      };
      const threshold = thresholds[date];
      if (threshold) {
        videos = videos.filter((v) => {
          if (!v.publishedAt) return true;
          return new Date(v.publishedAt).getTime() >= threshold;
        });
      }
    }

    // ── 6. Paginate ────────────────────────────────────────────────────────
    const totalItems  = videos.length;
    const totalPages  = Math.max(1, Math.ceil(totalItems / VIDEOS_PER_PAGE));
    const safePage    = Math.min(currentPage, totalPages);
    const start       = (safePage - 1) * VIDEOS_PER_PAGE;
    const pageVideos  = videos.slice(start, start + VIDEOS_PER_PAGE);

    return sendPaginated(
      res,
      pageVideos,
      buildPagination(safePage, VIDEOS_PER_PAGE, totalItems),
      'Videos fetched successfully.',
    );
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/videos/categories
// Returns all active categories — no YouTube call
// ─────────────────────────────────────────────────────────────────────────────

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    const categories_mapped = categories.map(c => ({ ...c, id: c._id.toString() }));

    return sendSuccess(res, categories_mapped, 'Categories fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/videos/:videoId
// Returns full details for a single YouTube video
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:videoId', async (req, res, next) => {
  try {
    const { videoId } = req.params;

    if (!videoId || videoId.length < 5) {
      return sendError(res, 'Invalid YouTube video ID.', 400);
    }

    const video = await getVideoById(String(videoId));

    if (!video) {
      return sendError(res, 'Video not found.', 404);
    }

    return sendSuccess(res, video, 'Video fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

export default router;
