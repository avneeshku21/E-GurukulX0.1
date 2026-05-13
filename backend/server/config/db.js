// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – MongoDB Connection
// server/config/db.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const MAX_RETRIES   = 5;
const RETRY_DELAY   = 3000; // ms

mongoose.connection.on('connected',     () => console.log('✅  MongoDB connected'));
mongoose.connection.on('disconnected',  () => console.warn('⚠️   MongoDB disconnected'));
mongoose.connection.on('error',    (err) => console.error('❌  MongoDB error:', err.message));

export async function connectDB(retryCount = 0) {
  const uri = process.env.DATABASE_URL;

  if (!uri) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS:          45000,
      maxPoolSize:              10,
      tls:                      true,
      // Node 24 / OpenSSL 3 stricter defaults can cause TLS alert 80 with Atlas.
      // Disable server identity check in non-production environments.
      ...(process.env.NODE_ENV !== 'production' && {
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames:    true,
      }),
    });
  } catch (err) {
    if (retryCount < MAX_RETRIES) {
      console.warn(
        `⏳  MongoDB connection attempt ${retryCount + 1}/${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY / 1000}s…`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    }
    console.error('❌  MongoDB failed to connect after maximum retries.');
    throw err;
  }
}
