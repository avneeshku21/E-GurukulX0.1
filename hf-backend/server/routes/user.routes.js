// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – User Routes
// server/routes/user.routes.js
// Mounted at: /api/user
// ─────────────────────────────────────────────────────────────────────────────

import { Router }      from 'express';
import mongoose        from 'mongoose';
import User            from '../models/User.model.js';
import Category        from '../models/Category.model.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate }    from '../middleware/validate.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  categorySelectionSchema,
} from '../validators/user.validator.js';

const router = Router();
router.use(verifyToken);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/user
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('categoryIds').lean();

    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    const safeUser = { ...user, id: user._id.toString() };
    delete safeUser._id;
    delete safeUser.__v;
    delete safeUser.passwordHash;

    return sendSuccess(res, safeUser, 'Profile fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/user
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/', validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { name, bio, githubUrl, linkedinUrl, twitterUrl } = req.body;

    const data = {};
    if (name        !== undefined) data.name        = name;
    if (bio         !== undefined) data.bio         = bio;
    if (githubUrl   !== undefined) data.githubUrl   = githubUrl   || null;
    if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl || null;
    if (twitterUrl  !== undefined) data.twitterUrl  = twitterUrl  || null;
    if (req.body.avatarUrl !== undefined) data.avatarUrl = req.body.avatarUrl || null;

    if (Object.keys(data).length === 0) {
      return sendError(res, 'No fields provided to update.', 400);
    }

    const updated = await User.findByIdAndUpdate(req.user.id, data, { new: true }).lean();
    if (!updated) return sendError(res, 'User not found.', 404);

    const safeUser = { ...updated, id: updated._id.toString() };
    delete safeUser._id;
    delete safeUser.__v;
    delete safeUser.passwordHash;

    return sendSuccess(res, safeUser, 'Profile updated successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/user/categories
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/categories', validate(categorySelectionSchema), async (req, res, next) => {
  try {
    const { categoryIds } = req.body;

    // Validate all IDs are valid ObjectIds and exist
    const objectIds = categoryIds.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) throw Object.assign(new Error(`Invalid category ID: ${id}`), { statusCode: 400 });
      return new mongoose.Types.ObjectId(id);
    });

    const validCategories = await Category.find({ _id: { $in: objectIds }, isActive: true });

    if (validCategories.length !== categoryIds.length) {
      return sendError(res, 'One or more category IDs are invalid or inactive.', 400);
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { categoryIds: objectIds },
      { new: true },
    ).populate('categoryIds').lean();

    const safeUser = { ...updated, id: updated._id.toString() };
    delete safeUser._id;
    delete safeUser.__v;
    delete safeUser.passwordHash;

    return sendSuccess(res, safeUser, 'Categories updated successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/user/password
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/password', validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('passwordHash');
    if (!user) return sendError(res, 'User not found.', 404);

    if (!user.passwordHash) {
      return sendError(res, 'This account uses OAuth login and does not have a password.', 400);
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) return sendError(res, 'Current password is incorrect.', 401);

    const newHash = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, { passwordHash: newHash });

    return sendSuccess(res, null, 'Password changed successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/user
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/', async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { deletedAt: new Date() });

    res.clearCookie('edutrack_token', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path:     '/',
      maxAge:   0,
    });

    return sendSuccess(res, null, 'Account scheduled for deletion. Your data will be removed within 30 days.');
  } catch (err) {
    return next(err);
  }
});

export default router;
