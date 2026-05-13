// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – JWT Utilities
// server/utils/jwt.js
// ─────────────────────────────────────────────────────────────────────────────

import jwt from 'jsonwebtoken';

const JWT_SECRET          = process.env.JWT_SECRET;
const JWT_EXPIRY          = process.env.JWT_EXPIRY          ?? '7d';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY ?? '30d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set.');
}

// ─────────────────────────────────────────────────────────────────────────────
// generateToken
//
// Creates a short-lived access token for a user.
//
// @param {object} payload         - Data to embed (userId, email, role, etc.)
// @param {string} [expiry]        - Override default expiry
// @returns {string}               - Signed JWT string
// ─────────────────────────────────────────────────────────────────────────────

export function generateToken(payload, expiry = JWT_EXPIRY) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiry });
}

// ─────────────────────────────────────────────────────────────────────────────
// generateRefreshToken
//
// Creates a long-lived refresh token.  Store the token hash server-side
// (or in a DB) if you want the ability to revoke it.
//
// @param {string} userId
// @returns {string} - Signed JWT string (30-day expiry by default)
// ─────────────────────────────────────────────────────────────────────────────

export function generateRefreshToken(userId) {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// verifyToken
//
// Verifies and decodes a JWT.  Returns the decoded payload on success,
// or null if the token is invalid / expired — does NOT throw.
//
// @param {string} token
// @returns {object|null} - Decoded payload or null
// ─────────────────────────────────────────────────────────────────────────────

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateRememberMeToken
//
// Creates a 30-day "remember me" access token so users stay logged in
// across browser sessions when they tick "Remember me" on the login form.
//
// @param {string} userId
// @returns {string} - Signed JWT string
// ─────────────────────────────────────────────────────────────────────────────

export function generateRememberMeToken(userId) {
  return jwt.sign(
    { userId, type: 'remember_me' },
    JWT_SECRET,
    { expiresIn: '30d' },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// decodeTokenUnsafe
//
// Decodes a JWT WITHOUT verifying the signature.
// Use only when you need to inspect an expired token's payload (e.g. to look
// up the user for re-issuance via refresh token flow).
//
// @param {string} token
// @returns {object|null}
// ─────────────────────────────────────────────────────────────────────────────

export function decodeTokenUnsafe(token) {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}
