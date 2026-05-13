// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – In-Memory Rate Limiter Middleware
// server/middleware/rateLimit.middleware.js
//
// Uses a plain Map — no Redis required.
// Each entry: { count: number, windowStart: number, lockedUntil: number|null }
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} RateLimitEntry
 * @property {number}      count        - Attempts in current window
 * @property {number}      windowStart  - Epoch ms when the current window started
 * @property {number|null} lockedUntil  - Epoch ms until which the IP is blocked (null if not locked)
 */

/** @type {Map<string, RateLimitEntry>} */
const store = new Map();

// ── Constants ──────────────────────────────────────────────────────────────

const LOGIN_MAX_ATTEMPTS  = 5;
const LOGIN_WINDOW_MS     = 15 * 60 * 1000;  // 15 minutes
const LOGIN_LOCKOUT_MS    = 15 * 60 * 1000;  // 15-minute lockout

// ── Cleanup: prune expired entries every 10 minutes to prevent memory leak ──

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    const expired =
      entry.lockedUntil !== null
        ? now > entry.lockedUntil
        : now > entry.windowStart + LOGIN_WINDOW_MS;

    if (expired) store.delete(key);
  }
}, 10 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derive a safe IP string from the request.
 * Handles X-Forwarded-For (trusted proxies, Vercel, etc.) gracefully.
 *
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For: client, proxy1, proxy2 — take the first (leftmost)
    return String(forwarded).split(',')[0].trim();
  }
  return req.socket?.remoteAddress ?? req.ip ?? 'unknown';
}

// ─────────────────────────────────────────────────────────────────────────────
// loginRateLimit middleware
//
// Allows up to LOGIN_MAX_ATTEMPTS per IP within a LOGIN_WINDOW_MS window.
// After exceeding the limit, the IP is locked for LOGIN_LOCKOUT_MS.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function loginRateLimit(req, res, next) {
  const ip  = getClientIp(req);
  const now = Date.now();
  const key = `login:${ip}`;

  let entry = store.get(key);

  // ── First visit from this IP ─────────────────────────────────────────────
  if (!entry) {
    store.set(key, { count: 1, windowStart: now, lockedUntil: null });
    return next();
  }

  // ── IP is currently locked ───────────────────────────────────────────────
  if (entry.lockedUntil !== null) {
    if (now < entry.lockedUntil) {
      const secondsLeft = Math.ceil((entry.lockedUntil - now) / 1000);
      const minutesLeft = Math.ceil(secondsLeft / 60);
      return res.status(429).json({
        success:     false,
        message:     `Too many login attempts. Try again in ${minutesLeft} minute(s).`,
        retryAfter:  entry.lockedUntil,
        secondsLeft,
      });
    }
    // Lock has expired — reset the entry
    entry = { count: 1, windowStart: now, lockedUntil: null };
    store.set(key, entry);
    return next();
  }

  // ── Window has expired — start a fresh window ────────────────────────────
  if (now > entry.windowStart + LOGIN_WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now, lockedUntil: null });
    return next();
  }

  // ── Increment attempt count within the current window ───────────────────
  entry.count += 1;

  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    // Apply lockout
    entry.lockedUntil = now + LOGIN_LOCKOUT_MS;
    store.set(key, entry);

    const secondsLeft = Math.ceil(LOGIN_LOCKOUT_MS / 1000);
    const minutesLeft = Math.ceil(secondsLeft / 60);
    return res.status(429).json({
      success:     false,
      message:     `Too many login attempts. Your IP has been locked for ${minutesLeft} minute(s).`,
      retryAfter:  entry.lockedUntil,
      secondsLeft,
    });
  }

  store.set(key, entry);
  // Attach remaining attempts header for client awareness
  res.setHeader('X-RateLimit-Limit',     LOGIN_MAX_ATTEMPTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, LOGIN_MAX_ATTEMPTS - entry.count));
  res.setHeader('X-RateLimit-Reset',     Math.ceil((entry.windowStart + LOGIN_WINDOW_MS) / 1000));

  return next();
}

// ─────────────────────────────────────────────────────────────────────────────
// createRateLimit — generic factory for other endpoints
//
// @param {object} options
// @param {number} options.maxAttempts  - Max requests per window (default 60)
// @param {number} options.windowMs     - Window duration in ms (default 60_000)
// @param {string} [options.keyPrefix]  - Prefix for the store key (default 'rl')
// @returns {import('express').RequestHandler}
// ─────────────────────────────────────────────────────────────────────────────

export function createRateLimit({
  maxAttempts = 60,
  windowMs    = 60_000,
  keyPrefix   = 'rl',
} = {}) {
  return (req, res, next) => {
    const ip  = getClientIp(req);
    const now = Date.now();
    const key = `${keyPrefix}:${ip}`;

    let entry = store.get(key);

    if (!entry || now > entry.windowStart + windowMs) {
      store.set(key, { count: 1, windowStart: now, lockedUntil: null });
      return next();
    }

    entry.count += 1;

    if (entry.count > maxAttempts) {
      const secondsLeft = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      return res.status(429).json({
        success:    false,
        message:    'Rate limit exceeded. Please slow down.',
        retryAfter: entry.windowStart + windowMs,
        secondsLeft,
      });
    }

    store.set(key, entry);
    res.setHeader('X-RateLimit-Limit',     maxAttempts);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxAttempts - entry.count));
    res.setHeader('X-RateLimit-Reset',     Math.ceil((entry.windowStart + windowMs) / 1000));
    return next();
  };
}
