// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Express API Server
// Entry point: server/index.js
// ─────────────────────────────────────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { startContestScheduler } from './config/contestScheduler.js';

// ── Route imports ─────────────────────────────────────────────────────────────
import authRoutes        from './routes/auth.routes.js';
import userRoutes        from './routes/user.routes.js';
import videoRoutes       from './routes/video.routes.js';
import playlistRoutes    from './routes/playlist.routes.js';
import notesRoutes       from './routes/notes.routes.js';
import progressRoutes    from './routes/progress.routes.js';
import certificateRoutes from './routes/certificate.routes.js';
import uploadRoutes      from './routes/upload.routes.js';
import adminRoutes       from './routes/admin.routes.js';
import contestRoutes     from './routes/contest.routes.js';
import { fetchAndStoreContests } from './services/contest.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// App initialisation
// ─────────────────────────────────────────────────────────────────────────────

const app  = express();
const PORT = parseInt(process.env.PORT ?? '5000', 10);
const IS_VERCEL = Boolean(process.env.VERCEL);

app.set('trust proxy', 1);

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────

// CORS — allow Vite dev server and production frontend
const configuredOrigins = [
  process.env.VITE_APP_URL,
  ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
]
  .map((origin) => origin?.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...new Set(configuredOrigins),
];

function isAllowedDevOrigin(origin) {
  try {
    const parsed = new URL(origin);
    const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    return process.env.NODE_ENV !== 'production' && isLocalHost;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (server-to-server, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || isAllowedDevOrigin(origin)) return callback(null, true);
      return callback(new Error(`CORS policy: origin "${origin}" not allowed`));
    },
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────────────
// Health check (unauthenticated)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'E-GurukulX API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────

app.use('/api/auth',        authRoutes);
app.use('/api/user',        userRoutes);
app.use('/api/videos',      videoRoutes);
app.use('/api/playlist',    playlistRoutes);
app.use('/api/notes',       notesRoutes);
app.use('/api/progress',    progressRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/upload',      uploadRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/contests',    contestRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler — must come after all routes
// ─────────────────────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler — must have exactly 4 params so Express identifies it
// ─────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  // CORS errors bubble up as regular Error objects
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  const statusCode = err.statusCode ?? err.status ?? 500;
  const message    = err.message ?? 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[E-GurukulX Error]', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────

if (IS_VERCEL) {
  try {
    await connectDB();
    console.log('✅  Vercel function database connection ready');
  } catch (err) {
    console.error('❌  Failed to initialise Vercel function:', err.message);
    throw err;
  }
} else {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n🚀  E-GurukulX API server running on http://localhost:${PORT}`);
        console.log(`📡  Environment : ${process.env.NODE_ENV ?? 'development'}`);
        console.log(`🔑  JWT expiry  : ${process.env.JWT_EXPIRY ?? '7d'}\n`);
        // Cron jobs only make sense in a long-running server process.
        startContestScheduler();
        fetchAndStoreContests().catch(e => console.warn('[startup] contest seed:', e.message));
      });
    })
    .catch((err) => {
      console.error('❌  Failed to start server — MongoDB connection error:', err.message);
      process.exit(1);
    });
}

export default app;
