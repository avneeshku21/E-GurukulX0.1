// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Admin Routes
// server/routes/admin.routes.js
// Mounted at: /api/admin
// ─────────────────────────────────────────────────────────────────────────────

import { Router }        from 'express';
import mongoose          from 'mongoose';
import User              from '../models/User.model.js';
import Playlist          from '../models/Playlist.model.js';
import Certificate       from '../models/Certificate.model.js';
import Category          from '../models/Category.model.js';
import { requireAdmin }  from '../middleware/auth.middleware.js';
import { sendSuccess, sendError, sendPaginated, buildPagination } from '../utils/response.js';

const router = Router();
router.use(requireAdmin);

const USERS_PER_PAGE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────────────────────────

router.get('/stats', async (_req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, activeToday, newThisWeek, totalPlaylists, totalCertificates, allCategories] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ deletedAt: null, lastActiveDate: { $gte: todayStart } }),
      User.countDocuments({ deletedAt: null, createdAt: { $gte: weekAgo } }),
      Playlist.countDocuments(),
      Certificate.countDocuments({ isRevoked: false }),
      Category.find().sort({ name: 1 }).lean(),
    ]);

    // Category popularity: count users who have each category in categoryIds
    const categoryPopularity = await Promise.all(
      allCategories.map(async (cat) => {
        const userCount = await User.countDocuments({ categoryIds: cat._id });
        return { id: cat._id.toString(), name: cat.name, icon: cat.icon, color: cat.color, userCount };
      }),
    );
    categoryPopularity.sort((a, b) => b.userCount - a.userCount);

    return sendSuccess(res, {
      totalUsers, activeToday, newThisWeek, totalPlaylists, totalCertificates,
      categoryPopularity,
    }, 'Admin stats fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────────────────────────────────

router.get('/users', async (req, res, next) => {
  try {
    const { page = '1', search = '', role = '' } = req.query;
    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    const filter = { deletedAt: null };

    if (role && ['STUDENT', 'ADMIN'].includes(String(role).toUpperCase())) {
      filter.role = String(role).toUpperCase();
    }

    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { name:  { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const [totalItems, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * USERS_PER_PAGE)
        .limit(USERS_PER_PAGE)
        .lean(),
    ]);

    const mapped = users.map((u) => ({ ...u, id: u._id.toString(), _id: undefined, __v: undefined }));

    return sendPaginated(res, mapped, buildPagination(currentPage, USERS_PER_PAGE, totalItems), 'Users fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/suspend
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/users/:id/suspend', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid user ID.', 400);

    const user = await User.findById(id).select('isSuspended role deletedAt').lean();
    if (!user || user.deletedAt !== null) return sendError(res, 'User not found.', 404);
    if (user.role === 'ADMIN')            return sendError(res, 'Admin accounts cannot be suspended.', 403);

    const updated = await User.findByIdAndUpdate(id, { isSuspended: !user.isSuspended }, { new: true })
      .select('-passwordHash').lean();

    const safeUser = { ...updated, id: updated._id.toString(), _id: undefined, __v: undefined };
    return sendSuccess(res, safeUser, safeUser.isSuspended ? 'User suspended.' : 'User reactivated.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid user ID.', 400);

    const user = await User.findById(id).select('role').lean();
    if (!user)                 return sendError(res, 'User not found.', 404);
    if (user.role === 'ADMIN') return sendError(res, 'Admin accounts cannot be deleted via this endpoint.', 403);

    await User.findByIdAndDelete(id);
    return sendSuccess(res, null, 'User permanently deleted.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/categories
// ─────────────────────────────────────────────────────────────────────────────

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();

    const enriched = await Promise.all(
      categories.map(async (cat) => {
        const userCount = await User.countDocuments({ categoryIds: cat._id });
        return { ...cat, id: cat._id.toString(), _id: undefined, __v: undefined, userCount };
      }),
    );

    return sendSuccess(res, enriched, 'Categories fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/categories/:id
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/categories/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid category ID.', 400);

    const existing = await Category.findById(id).lean();
    if (!existing) return sendError(res, 'Category not found.', 404);

    const { name, description, isActive, icon, color, youtubeQuery } = req.body;

    const data = {};
    if (name         !== undefined) data.name         = String(name).trim();
    if (description  !== undefined) data.description  = String(description).trim();
    if (isActive     !== undefined) data.isActive      = Boolean(isActive);
    if (icon         !== undefined) data.icon          = String(icon).trim();
    if (color        !== undefined) data.color         = String(color).trim();
    if (youtubeQuery !== undefined) data.youtubeQuery  = String(youtubeQuery).trim();

    if (Object.keys(data).length === 0) return sendError(res, 'No fields provided to update.', 400);

    const updated = await Category.findByIdAndUpdate(id, data, { new: true }).lean();
    return sendSuccess(res, { ...updated, id: updated._id.toString(), _id: undefined, __v: undefined }, 'Category updated successfully.');
  } catch (err) {
    if (err.code === 11000) return sendError(res, 'A category with that name or slug already exists.', 409);
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/categories
// ─────────────────────────────────────────────────────────────────────────────

router.post('/categories', async (req, res, next) => {
  try {
    const { name, description, icon, color, youtubeQuery } = req.body;

    if (!name || !description || !icon || !color || !youtubeQuery) {
      return sendError(res, 'name, description, icon, color, and youtubeQuery are required.', 400);
    }

    const slug = String(name)
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const category = await Category.create({
      name: String(name).trim(), slug,
      description: String(description).trim(),
      icon: String(icon).trim(), color: String(color).trim(),
      youtubeQuery: String(youtubeQuery).trim(), isActive: true,
    });

    return sendSuccess(res, category.toJSON(), 'Category created successfully.', 201);
  } catch (err) {
    if (err.code === 11000) return sendError(res, 'A category with that name or slug already exists.', 409);
    return next(err);
  }
});

export default router;
