// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Progress Routes
// server/routes/progress.routes.js
// Mounted at: /api/progress
// ─────────────────────────────────────────────────────────────────────────────

import { Router }        from 'express';
import mongoose          from 'mongoose';
import User              from '../models/User.model.js';
import Playlist          from '../models/Playlist.model.js';
import PlaylistVideo     from '../models/PlaylistVideo.model.js';
import Note              from '../models/Note.model.js';
import Certificate       from '../models/Certificate.model.js';
import { verifyToken }   from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { calculateProgress }      from '../utils/progressCalculator.js';
import { calculateStreak }        from '../utils/streakCalculator.js';
import { generateCertificateId }  from '../utils/hash.js';

function toDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function getDerivedStreakStats(dateKeys = []) {
  const uniqueDates = [...new Set(dateKeys)].sort();
  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let longestStreak = 1;
  let running = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const previous = new Date(`${uniqueDates[i - 1]}T00:00:00.000Z`);
    const current = new Date(`${uniqueDates[i]}T00:00:00.000Z`);
    const diffDays = Math.round((current - previous) / 86400000);
    if (diffDays === 1) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 1;
    }
  }

  const todayKey = toDateKey(new Date());
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayKey = toDateKey(yesterday);

  let currentStreak = 0;
  const latest = uniqueDates[uniqueDates.length - 1];
  if (latest === todayKey || latest === yesterdayKey) {
    currentStreak = 1;
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      const current = new Date(`${uniqueDates[i]}T00:00:00.000Z`);
      const previous = new Date(`${uniqueDates[i - 1]}T00:00:00.000Z`);
      const diffDays = Math.round((current - previous) / 86400000);
      if (diffDays !== 1) break;
      currentStreak += 1;
    }
  }

  return { currentStreak, longestStreak };
}

const router = Router();
router.use(verifyToken);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/complete
// ─────────────────────────────────────────────────────────────────────────────

router.post('/complete', async (req, res, next) => {
  try {
    const { playlistVideoId, watchedSeconds = 0 } = req.body;

    if (!playlistVideoId || !mongoose.Types.ObjectId.isValid(playlistVideoId)) {
      return sendError(res, 'Valid playlistVideoId is required.', 400);
    }

    const video = await PlaylistVideo.findById(playlistVideoId).lean();
    if (!video) return sendError(res, 'Video not found.', 404);

    const playlist = await Playlist.findById(video.playlistId).lean();
    if (!playlist) return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    // Idempotent
    if (video.isCompleted) {
      return sendSuccess(res, { playlist, streakUpdate: null, certificateIssued: false }, 'Video already completed.');
    }

    // Mark video complete
    await PlaylistVideo.findByIdAndUpdate(playlistVideoId, {
      isCompleted:    true,
      completedAt:    new Date(),
      lastWatchedAt:  new Date(),
      watchedSeconds: Math.max(watchedSeconds, video.watchedSeconds),
    });

    // Recount
    const newCompletedCount = await PlaylistVideo.countDocuments({ playlistId: video.playlistId, isCompleted: true });
    const newProgress       = calculateProgress(newCompletedCount, playlist.totalVideos);

    let updatedPlaylist = await Playlist.findByIdAndUpdate(
      video.playlistId,
      { completedCount: newCompletedCount, progressPercent: newProgress },
      { new: true },
    ).lean();

    // Streak
    const user = await User.findById(req.user.id).select('currentStreak longestStreak lastActiveDate').lean();
    const streakResult = calculateStreak(user.lastActiveDate, user.currentStreak, user.longestStreak);

    await User.findByIdAndUpdate(req.user.id, {
      currentStreak:  streakResult.currentStreak,
      longestStreak:  streakResult.longestStreak,
      lastActiveDate: new Date(streakResult.lastActiveDate),
    });

    // Certificate check
    let certificateIssued = false;
    let certificate       = null;

    if (newProgress === 100 && !playlist.certificateIssued) {
      const certId = generateCertificateId();
      try {
        certificate = await Certificate.create({
          userId:        req.user.id,
          playlistId:    video.playlistId,
          certificateId: certId,
        });
      } catch (dupErr) {
        // Already exists — fetch it
        certificate = await Certificate.findOne({ userId: req.user.id, playlistId: video.playlistId }).lean();
      }

      updatedPlaylist = await Playlist.findByIdAndUpdate(
        video.playlistId,
        { certificateIssued: true, isCompleted: true, completedAt: new Date() },
        { new: true },
      ).lean();

      certificateIssued = true;
    }

    return sendSuccess(
      res,
      {
        playlist:         { ...updatedPlaylist, id: updatedPlaylist._id.toString() },
        streakUpdate:     streakResult,
        certificateIssued,
        ...(certificate ? { certificate: { ...certificate.toJSON?.() ?? certificate, id: certificate._id?.toString() } } : {}),
      },
      certificateIssued ? 'Playlist complete! Certificate issued.' : 'Video marked as completed.',
    );
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/progress/incomplete
// ─────────────────────────────────────────────────────────────────────────────

router.post('/incomplete', async (req, res, next) => {
  try {
    const { playlistVideoId } = req.body;

    if (!playlistVideoId || !mongoose.Types.ObjectId.isValid(playlistVideoId)) {
      return sendError(res, 'Valid playlistVideoId is required.', 400);
    }

    const video = await PlaylistVideo.findById(playlistVideoId).lean();
    if (!video) return sendError(res, 'Video not found.', 404);

    const playlist = await Playlist.findById(video.playlistId).lean();
    if (!playlist) return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    // Idempotent
    if (!video.isCompleted) {
      return sendSuccess(res, { playlist: { ...playlist, id: playlist._id.toString() } }, 'Video already incomplete.');
    }

    // Unmark video
    await PlaylistVideo.findByIdAndUpdate(playlistVideoId, {
      isCompleted: false,
      completedAt: null,
    });

    // Recount
    const newCompletedCount = await PlaylistVideo.countDocuments({ playlistId: video.playlistId, isCompleted: true });
    const newProgress       = calculateProgress(newCompletedCount, playlist.totalVideos);

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      video.playlistId,
      {
        completedCount:  newCompletedCount,
        progressPercent: newProgress,
        // If playlist was previously completed, reset it
        ...(playlist.isCompleted ? { isCompleted: false, completedAt: null } : {}),
      },
      { new: true },
    ).lean();

    return sendSuccess(
      res,
      { playlist: { ...updatedPlaylist, id: updatedPlaylist._id.toString() } },
      'Video marked as incomplete.',
    );
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/progress/watched
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/watched', async (req, res, next) => {
  try {
    const { playlistVideoId, watchedSeconds } = req.body;

    if (!playlistVideoId || !mongoose.Types.ObjectId.isValid(playlistVideoId)) {
      return sendError(res, 'Valid playlistVideoId is required.', 400);
    }

    const parsed = parseInt(watchedSeconds, 10);
    if (isNaN(parsed) || parsed < 0) {
      return sendError(res, 'watchedSeconds must be a non-negative integer.', 400);
    }

    const video = await PlaylistVideo.findById(playlistVideoId).lean();
    if (!video) return sendError(res, 'Video not found.', 404);

    const playlist = await Playlist.findById(video.playlistId).select('userId').lean();
    if (!playlist || playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    if (parsed > video.watchedSeconds) {
      await PlaylistVideo.findByIdAndUpdate(playlistVideoId, { watchedSeconds: parsed, lastWatchedAt: new Date() });

      const user = await User.findById(req.user.id).select('currentStreak longestStreak lastActiveDate').lean();
      const streakResult = calculateStreak(user?.lastActiveDate ?? null, user?.currentStreak ?? 0, user?.longestStreak ?? 0);
      await User.findByIdAndUpdate(req.user.id, {
        currentStreak: streakResult.currentStreak,
        longestStreak: streakResult.longestStreak,
        lastActiveDate: new Date(streakResult.lastActiveDate),
      });
    }

    return sendSuccess(res, { watchedSeconds: Math.max(parsed, video.watchedSeconds) }, 'Watch progress saved.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/playlist/:playlistId
// ─────────────────────────────────────────────────────────────────────────────

router.get('/playlist/:playlistId', async (req, res, next) => {
  try {
    const { playlistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(playlistId)) return sendError(res, 'Invalid playlist ID.', 400);

    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    const videos = await PlaylistVideo.find({ playlistId }).sort({ sortOrder: 1 }).lean();

    return sendSuccess(
      res,
      {
        totalVideos:     playlist.totalVideos,
        completedCount:  playlist.completedCount,
        progressPercent: playlist.progressPercent,
        videos: videos.map((v) => ({ ...v, id: v._id.toString(), _id: undefined, __v: undefined })),
      },
      'Progress fetched successfully.',
    );
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/progress/dashboard
// ─────────────────────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [user, playlists, certificates, recentNotes] = await Promise.all([
      User.findById(userId).select('currentStreak longestStreak lastActiveDate name avatarUrl').lean(),
      Playlist.find({ userId }).sort({ updatedAt: -1 }).populate('categoryId').lean(),
      Certificate.find({ userId })
        .sort({ issuedAt: -1 })
        .populate({
          path: 'playlistId',
          select: 'name thumbnailUrl totalVideos completedCount progressPercent completedAt',
        })
        .lean(),
      Note.find({ userId }).sort({ updatedAt: -1 }).limit(6).select('id type title content tags updatedAt playlistId linkedVideoId').lean(),
    ]);

    // Get videos for all playlists
    const playlistIds = playlists.map((p) => p._id);
    const allVideos   = await PlaylistVideo.find({ playlistId: { $in: playlistIds } }).lean();

    // Build playlist map for enrichment
    const playlistMap = {};
    for (const pl of playlists) playlistMap[pl._id.toString()] = pl;

    const videosByPlaylist = {};
    for (const v of allVideos) {
      const pid = v.playlistId.toString();
      if (!videosByPlaylist[pid]) videosByPlaylist[pid] = [];
      videosByPlaylist[pid].push(v);
    }

    const enrichedPlaylists = playlists.map((pl) => ({
      ...pl,
      id: pl._id.toString(),
      _id: undefined,
      __v: undefined,
      videos: (videosByPlaylist[pl._id.toString()] || []).map((v) => ({ ...v, id: v._id.toString(), _id: undefined, __v: undefined })),
      category: pl.categoryId ? { ...pl.categoryId, id: pl.categoryId._id?.toString() } : null,
    }));

    const totalVideosCompleted = playlists.reduce((s, p) => s + (p.completedCount || 0), 0);
    const totalVideos          = playlists.reduce((s, p) => s + (p.totalVideos || 0), 0);
    const totalWatchedSeconds  = allVideos.reduce((s, v) => s + (v.watchedSeconds || 0), 0);

    const inProgressCount = playlists.filter((p) => p.progressPercent > 0 && p.progressPercent < 100).length;
    const completedCount  = playlists.filter((p) => p.progressPercent >= 100).length;
    const overallPercent  = totalVideos > 0 ? Math.round((totalVideosCompleted / totalVideos) * 100) : 0;

    // Activity heatmap — last 182 days
    const doneVideos  = allVideos.filter((v) => v.isCompleted && v.completedAt);
    const activityMap = {};
    for (const v of doneVideos) {
      const dateStr = toDateKey(v.completedAt);
      activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    }
    const activityData = [];
    for (let i = 181; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toDateKey(d);
      activityData.push({ date: dateStr, count: activityMap[dateStr] || 0 });
    }

    const watchMinutesByDate = {};
    for (const v of allVideos) {
      const activityDate = v.lastWatchedAt ?? v.completedAt;
      if (!activityDate) continue;
      const dateStr = toDateKey(activityDate);
      const minutes = v.watchedSeconds > 0 ? Number((v.watchedSeconds / 60).toFixed(1)) : 0;
      watchMinutesByDate[dateStr] = Number(((watchMinutesByDate[dateStr] || 0) + minutes).toFixed(1));
    }

    const playlistsCompletedByDate = {};
    for (const pl of playlists) {
      if (!pl.completedAt || pl.progressPercent < 100) continue;
      const dateStr = toDateKey(pl.completedAt);
      playlistsCompletedByDate[dateStr] = (playlistsCompletedByDate[dateStr] || 0) + 1;
    }

    const activityDateKeys = allVideos.flatMap((video) => [video.lastWatchedAt, video.completedAt].filter(Boolean).map(toDateKey));
    const derivedStreaks = getDerivedStreakStats(activityDateKeys);

    function buildRangeSeries(days) {
      const series = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        series.push({
          date: dateStr,
          label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d),
          videosCompleted: activityMap[dateStr] || 0,
          minutesWatched: watchMinutesByDate[dateStr] || 0,
          playlistsCompleted: playlistsCompletedByDate[dateStr] || 0,
        });
      }
      return series;
    }

    const activitySeries = {
      '7': buildRangeSeries(7),
      '30': buildRangeSeries(30),
      '90': buildRangeSeries(90),
    };

    // ── Recently completed videos (last 12) ───────────────────────────────────
    const recentlyCompleted = [...doneVideos]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 12)
      .map((v) => {
        const pl = playlistMap[v.playlistId.toString()];
        return {
          id:              v._id.toString(),
          youtubeVideoId:  v.youtubeVideoId,
          title:           v.title,
          thumbnailUrl:    v.thumbnailUrl,
          channelTitle:    v.channelTitle,
          durationSeconds: v.durationSeconds,
          watchedSeconds:  v.watchedSeconds,
          completedAt:     v.completedAt,
          playlist: pl
            ? { id: pl._id.toString(), name: pl.name, thumbnailUrl: pl.thumbnailUrl }
            : null,
        };
      });

    // ── Continue watching — most recently watched incomplete video ─────────────
    const continueWatchingVideo = allVideos
      .filter((v) => !v.isCompleted && v.lastWatchedAt)
      .sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt))[0] ?? null;

    let continueWatching = null;
    if (continueWatchingVideo) {
      const pl = playlistMap[continueWatchingVideo.playlistId.toString()];
      continueWatching = {
        id:              continueWatchingVideo._id.toString(),
        youtubeVideoId:  continueWatchingVideo.youtubeVideoId,
        title:           continueWatchingVideo.title,
        thumbnailUrl:    continueWatchingVideo.thumbnailUrl,
        channelTitle:    continueWatchingVideo.channelTitle,
        durationSeconds: continueWatchingVideo.durationSeconds,
        watchedSeconds:  continueWatchingVideo.watchedSeconds,
        lastWatchedAt:   continueWatchingVideo.lastWatchedAt,
        playlist: pl
          ? { id: pl._id.toString(), name: pl.name, thumbnailUrl: pl.thumbnailUrl }
          : null,
      };
    }

    // ── Completed playlists ───────────────────────────────────────────────────
    const completedPlaylists = playlists
      .filter((pl) => pl.progressPercent >= 100)
      .map((pl) => ({
        id:                pl._id.toString(),
        name:              pl.name,
        thumbnailUrl:      pl.thumbnailUrl,
        totalVideos:       pl.totalVideos,
        completedCount:    pl.completedCount,
        progressPercent:   pl.progressPercent,
        completedAt:       pl.completedAt,
        certificateIssued: pl.certificateIssued,
        category: pl.categoryId
          ? { id: pl.categoryId._id?.toString(), name: pl.categoryId.name }
          : null,
      }));

    return sendSuccess(
      res,
      {
        stats: {
          currentStreak:       Math.max(user?.currentStreak ?? 0, derivedStreaks.currentStreak),
          longestStreak:       Math.max(user?.longestStreak ?? 0, derivedStreaks.longestStreak),
          totalVideosCompleted,
          totalVideos,
          totalPlaylists:      playlists.length,
          inProgressCount,
          completedCount,
          certificateCount:    certificates.length,
          hoursWatched:        Math.floor(totalWatchedSeconds / 3600),
          minutesWatched:      Math.floor((totalWatchedSeconds % 3600) / 60),
          overallPercent,
          totalWatchHours:     Math.round(totalWatchedSeconds / 3600),
          avgCompletionPct:    playlists.length > 0
            ? Math.round(playlists.reduce((s, p) => s + (p.progressPercent || 0), 0) / playlists.length)
            : 0,
        },
        playlists: enrichedPlaylists,
        completedPlaylists,
        continueWatching,
        recentlyCompleted,
        certificates: certificates.map((c) => ({
          ...c,
          id: c._id.toString(),
          _id: undefined,
          __v: undefined,
          playlist: c.playlistId
            ? { ...c.playlistId, id: c.playlistId._id?.toString(), _id: undefined, __v: undefined }
            : null,
          playlistId: undefined,
        })),
        activityData,
        activitySeries,
        recentNotes: recentNotes.map((n) => ({ ...n, id: n._id.toString(), _id: undefined, __v: undefined })),
        recentCertificate: certificates[0] ? { ...certificates[0], id: certificates[0]._id.toString() } : null,
      },
      'Dashboard data fetched successfully.',
    );
  } catch (err) {
    return next(err);
  }
});

export default router;
