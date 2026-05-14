// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Authentication Middleware
// server/middleware/auth.middleware.js
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — extract raw token string from request
// ─────────────────────────────────────────────────────────────────────────────

function extractRawToken(req) {
  // 1. Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  // 2. httpOnly cookie named "edutrack_token"
  if (req.cookies && req.cookies.edutrack_token) {
    return req.cookies.edutrack_token;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// verifyToken — require a valid JWT; attach user to req.user
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyToken(req, res, next) {
  try {
    const rawToken = extractRawToken(req);

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(rawToken, JWT_SECRET);
    } catch (jwtErr) {
      const message =
        jwtErr.name === 'TokenExpiredError'
          ? 'Session expired. Please log in again.'
          : 'Invalid authentication token.';
      return res.status(401).json({ success: false, message });
    }

    // Fetch fresh user record to check suspension / soft-delete
    const user = await User.findById(decoded.userId).select(
      'id email name role avatarUrl isSuspended deletedAt lockedUntil',
    ).lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    if (user.deletedAt !== null) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deleted.',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockedUntil).getTime() - Date.now()) / 60_000,
      );
      return res.status(403).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`,
        lockedUntil: user.lockedUntil,
      });
    }

    req.user = { ...user, id: user._id.toString() };
    return next();
  } catch (err) {
    return next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// requireAdmin — verifyToken first, then enforce ADMIN role
// ─────────────────────────────────────────────────────────────────────────────

export function requireAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!req.user) {
      // verifyToken already responded; just return
      return;
    }
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.',
      });
    }
    return next();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// optionalAuth — attach user if token present and valid; never block the request
// ─────────────────────────────────────────────────────────────────────────────

export async function optionalAuth(req, _res, next) {
  try {
    const rawToken = extractRawToken(req);

    if (!rawToken) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(rawToken, JWT_SECRET);
    } catch {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.userId).select(
      'id email name role avatarUrl isSuspended deletedAt',
    ).lean();

    req.user =
      user && !user.isSuspended && user.deletedAt === null
        ? { ...user, id: user._id.toString() }
        : null;
    return next();
  } catch {
    req.user = null;
    return next();
  }
}
