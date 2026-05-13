// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Prisma Client Singleton
//
// Vite dev server uses HMR which can cause `new PrismaClient()` to be called
// on every hot-reload, exhausting the database connection pool.
// This module keeps a single instance alive on the Node.js `globalThis` object
// in development, and creates a fresh instance for production builds.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from '@prisma/client';

const globalForPrisma = /** @type {{ prisma?: PrismaClient }} */ (globalThis);

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
