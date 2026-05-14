// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Hashing & Token Generation Utilities
// server/utils/hash.js
// ─────────────────────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { format } from 'date-fns';

const BCRYPT_COST = 10;

// ─────────────────────────────────────────────────────────────────────────────
// hashPassword
//
// Hashes a plain-text password using bcrypt with cost factor 10.
//
// @param {string} plainPassword
// @returns {Promise<string>} - bcrypt hash
// ─────────────────────────────────────────────────────────────────────────────

export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(BCRYPT_COST);
  return bcrypt.hash(plainPassword, salt);
}

// ─────────────────────────────────────────────────────────────────────────────
// comparePassword
//
// Compares a plain-text password against a bcrypt hash.
//
// @param {string} plainPassword
// @param {string} hash            - Stored bcrypt hash
// @returns {Promise<boolean>}
// ─────────────────────────────────────────────────────────────────────────────

export async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

// ─────────────────────────────────────────────────────────────────────────────
// generateCertificateId
//
// Produces a human-readable unique certificate ID in the format:
//   CERT-YYYYMMDD-XXXXX
//   e.g. CERT-20260507-A3F9B
//
// @returns {string}
// ─────────────────────────────────────────────────────────────────────────────

export function generateCertificateId() {
  const datePart   = format(new Date(), 'yyyyMMdd');
  const randomPart = randomBytes(3).toString('hex').toUpperCase().slice(0, 5);
  return `CERT-${datePart}-${randomPart}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// hashCacheKey
//
// Creates an MD5 hash of an arbitrary string to use as a compact,
// deterministic cache key.
//
// @param {string} str - Any string (e.g. YouTube query + params)
// @returns {string}   - 32-character hex string
// ─────────────────────────────────────────────────────────────────────────────

export function hashCacheKey(str) {
  return createHash('md5').update(str).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// generateEmailToken
//
// Generates a cryptographically random 64-character hex token for use in
// email verification and password-reset flows.
//
// @returns {string} - 64-character lowercase hex string
// ─────────────────────────────────────────────────────────────────────────────

export function generateEmailToken() {
  return randomBytes(32).toString('hex');
}

export function hashEmailToken(token) {
  return createHash('sha256').update(String(token)).digest('hex');
}
