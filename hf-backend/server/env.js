// ─────────────────────────────────────────────────────────────────────────────
// Load environment variables BEFORE any other module (prisma, jwt, etc.)
// This file must be the FIRST import in index.js.
// In ESM, imports are evaluated depth-first in declaration order, so
// importing this file first guarantees process.env is populated before
// PrismaClient or JWT_SECRET checks run in other modules.
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });
