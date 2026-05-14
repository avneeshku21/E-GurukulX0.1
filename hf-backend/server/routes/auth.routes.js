// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Authentication Routes
// server/routes/auth.routes.js
// Mounted at: /api/auth
// ─────────────────────────────────────────────────────────────────────────────

import { Router }        from 'express';
import User              from '../models/User.model.js';
import { verifyToken }   from '../middleware/auth.middleware.js';
import { validate }      from '../middleware/validate.middleware.js';
import { loginRateLimit } from '../middleware/rateLimit.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateToken, generateRememberMeToken } from '../utils/jwt.js';
import { hashPassword, comparePassword, generateEmailToken } from '../utils/hash.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/user.validator.js';

const router = Router();

// ── Cookie helpers ──────────────────────────────────────────────────────────

const COOKIE_NAME    = 'edutrack_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  path:     '/',
};

function setAuthCookie(res, token, rememberMe = false) {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7  * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTIONS, maxAge });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role:          'STUDENT',
      emailVerified: false,
    });

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });
    setAuthCookie(res, token, false);

    return sendSuccess(res, { user: user.toJSON(), token }, 'Account created successfully.', 201);
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, 'An account with this email already exists.', 409);
    }
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────

router.post('/login', loginRateLimit, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Select passwordHash explicitly (excluded by default via toJSON transform)
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('name email passwordHash role avatarUrl isSuspended deletedAt lockedUntil failedLoginAttempts currentStreak longestStreak lastActiveDate emailVerified bio githubUrl linkedinUrl twitterUrl createdAt updatedAt');

    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    if (user.deletedAt !== null) {
      return sendError(res, 'This account no longer exists.', 401);
    }

    if (user.isSuspended) {
      return sendError(res, 'Your account has been suspended. Please contact support.', 403);
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const secondsLeft = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 1000);
      const minutesLeft = Math.ceil(secondsLeft / 60);
      return res.status(423).json({
        success: false,
        message: `Account is locked. Try again in ${minutesLeft} minute(s).`,
        lockedUntil: user.lockedUntil,
        secondsLeft,
      });
    }

    const passwordMatch = await comparePassword(password, user.passwordHash ?? '');

    if (!passwordMatch) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock  = newAttempts >= 5;

      await User.findByIdAndUpdate(user._id, {
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
      });

      if (shouldLock) {
        return sendError(res, 'Too many failed attempts. Account locked for 15 minutes.', 401);
      }

      return sendError(res, `Invalid email or password. ${5 - newAttempts} attempt(s) remaining.`, 401);
    }

    await User.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      lockedUntil:         null,
      lastActiveDate:      new Date(),
    });

    const token = rememberMe
      ? generateRememberMeToken(user._id.toString())
      : generateToken({ userId: user._id.toString(), email: user.email, role: user.role });

    setAuthCookie(res, token, rememberMe);

    // Build safe user object (without passwordHash)
    const safeUser = user.toJSON();

    return sendSuccess(res, { user: safeUser, token }, 'Login successful.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, null, 'Logged out successfully.');
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────

router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (user && !user.deletedAt) {
      const resetToken = generateEmailToken();
      console.log('─────────────────────────────────────────────────');
      console.log('PASSWORD RESET TOKEN :', resetToken);
      console.log('For user             :', user.email);
      console.log('Reset URL            :', `${process.env.VITE_APP_URL ?? 'http://localhost:3000'}/reset-password?token=${resetToken}`);
      console.log('─────────────────────────────────────────────────');
    }

    return sendSuccess(
      res,
      null,
      'If an account with that email exists, a password reset link has been sent.',
    );
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────

router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  return sendError(res, 'Password reset via link requires email integration. Please contact support.', 503);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────

router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('categoryIds').lean();

    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    const safeUser = { ...user, id: user._id.toString() };
    delete safeUser._id;
    delete safeUser.__v;
    delete safeUser.passwordHash;

    return sendSuccess(res, safeUser, 'User fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/google  (stub)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/google', async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return sendError(res, 'Google credential token is required.', 400);
    }
    console.log('Google OAuth stub — credential received (length):', credential.length);
    return sendSuccess(res, { user: null, token: null }, 'Google OAuth stub — not yet fully implemented.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/github  (stub)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/github', async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return sendError(res, 'GitHub OAuth code is required.', 400);
    }
    console.log('GitHub OAuth stub — code received:', code);
    return sendSuccess(res, { user: null, token: null }, 'GitHub OAuth stub — not yet fully implemented.');
  } catch (err) {
    return next(err);
  }
});

export default router;
