// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Playlist Routes
// server/routes/playlist.routes.js
// Mounted at: /api/playlist
// ─────────────────────────────────────────────────────────────────────────────

import { Router }        from 'express';
import mongoose          from 'mongoose';
import Playlist          from '../models/Playlist.model.js';
import PlaylistVideo     from '../models/PlaylistVideo.model.js';
import Category          from '../models/Category.model.js';
import Certificate       from '../models/Certificate.model.js';
import { verifyToken }   from '../middleware/auth.middleware.js';
import { validate }      from '../middleware/validate.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { calculateProgress }      from '../utils/progressCalculator.js';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addVideoSchema,
  reorderSchema,
} from '../validators/playlist.validator.js';

const router = Router();
router.use(verifyToken);

// ── Helper: serialize a playlist + its videos for the response ───────────────

async function populatePlaylist(playlistId) {
  const playlist = await Playlist.findById(playlistId).populate('categoryId').lean();
  if (!playlist) return null;
  const videos = await PlaylistVideo.find({ playlistId }).sort({ sortOrder: 1 }).lean();
  const certificate = await Certificate.findOne({ playlistId, isRevoked: false }).lean();

  return {
    ...playlist,
    id: playlist._id.toString(),
    _id: undefined,
    __v: undefined,
    videos: videos.map((v) => ({ ...v, id: v._id.toString(), _id: undefined, __v: undefined })),
    certificate: certificate
      ? { ...certificate, id: certificate._id.toString(), _id: undefined, __v: undefined }
      : null,
    category: playlist.categoryId
      ? { ...playlist.categoryId, id: playlist.categoryId._id.toString(), _id: undefined, __v: undefined }
      : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/playlist
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('categoryId')
      .lean();

    const enriched = await Promise.all(
      playlists.map(async (pl) => {
        const videos = await PlaylistVideo.find({ playlistId: pl._id }).sort({ sortOrder: 1 }).lean();
        const certificate = await Certificate.findOne({ playlistId: pl._id, isRevoked: false }).lean();
        return {
          ...pl,
          id: pl._id.toString(),
          _id: undefined,
          __v: undefined,
          videos: videos.map((v) => ({ ...v, id: v._id.toString(), _id: undefined, __v: undefined })),
          certificate: certificate
            ? { ...certificate, id: certificate._id.toString(), _id: undefined, __v: undefined }
            : null,
          category: pl.categoryId
            ? { ...pl.categoryId, id: pl.categoryId._id.toString(), _id: undefined, __v: undefined }
            : null,
        };
      }),
    );

    return sendSuccess(res, enriched, 'Playlists fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/playlist
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', validate(createPlaylistSchema), async (req, res, next) => {
  try {
    const { name, categoryId } = req.body;

    const playlist = await Playlist.create({
      userId:     req.user.id,
      name,
      categoryId: categoryId ?? null,
    });

    const result = await populatePlaylist(playlist._id);
    return sendSuccess(res, result, 'Playlist created successfully.', 201);
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/playlist/:id
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid playlist ID.', 400);

    const playlist = await Playlist.findById(id).lean();
    if (!playlist) return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    const result = await populatePlaylist(id);
    return sendSuccess(res, result, 'Playlist fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/playlist/enroll
// Auto-enroll a video
// ─────────────────────────────────────────────────────────────────────────────

router.post('/enroll', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      youtubeVideoId, title, thumbnailUrl, channelTitle,
      durationSeconds, viewCount, likeCount,
      playlistName, playlistId, categorySlug,
    } = req.body;

    if (!youtubeVideoId || !title || !thumbnailUrl || !channelTitle || !durationSeconds) {
      return sendError(res, 'Missing required video fields.', 400);
    }

    let targetPlaylist;

    if (playlistId) {
      if (!mongoose.Types.ObjectId.isValid(playlistId)) return sendError(res, 'Invalid playlist ID.', 400);
      targetPlaylist = await Playlist.findOne({ _id: playlistId, userId }).lean();
      if (!targetPlaylist) return sendError(res, 'Playlist not found.', 404);
    } else {
      const finalPlaylistName = playlistName || `${channelTitle} Videos`;
      targetPlaylist = await Playlist.findOne({ userId, name: finalPlaylistName }).lean();

      if (!targetPlaylist) {
        let categoryId = null;
        if (categorySlug) {
          const cat = await Category.findOne({ slug: categorySlug }).lean();
          categoryId = cat?._id ?? null;
        }
        targetPlaylist = await Playlist.create({
          userId, name: finalPlaylistName, categoryId, totalVideos: 0, completedCount: 0, progressPercent: 0,
        });
        targetPlaylist = targetPlaylist.toJSON();
      }
    }

    const playlistObjectId = targetPlaylist._id ?? targetPlaylist.id;

    // Idempotent check
    const existingVideo = await PlaylistVideo.findOne({ playlistId: playlistObjectId, youtubeVideoId }).lean();
    if (existingVideo) {
      return sendSuccess(
        res,
        { playlist: { ...targetPlaylist, id: targetPlaylist._id?.toString() ?? targetPlaylist.id }, video: { ...existingVideo, id: existingVideo._id.toString() }, alreadyEnrolled: true },
        'Video already enrolled in this playlist.',
      );
    }

    // Next sort order
    const lastVideo = await PlaylistVideo.findOne({ playlistId: playlistObjectId })
      .sort({ sortOrder: -1 }).select('sortOrder').lean();
    const nextOrder = (lastVideo?.sortOrder ?? -1) + 1;

    const newVideo = await PlaylistVideo.create({
      playlistId: playlistObjectId,
      youtubeVideoId,
      title,
      thumbnailUrl,
      channelTitle,
      durationSeconds: parseInt(durationSeconds, 10),
      viewCount:  Number(viewCount ?? 0),
      likeCount:  Number(likeCount ?? 0),
      sortOrder:  nextOrder,
      isCompleted: false,
      watchedSeconds: 0,
    });

    const newTotal     = await PlaylistVideo.countDocuments({ playlistId: playlistObjectId });
    const completedCnt = await PlaylistVideo.countDocuments({ playlistId: playlistObjectId, isCompleted: true });
    const progress     = newTotal > 0 ? Math.round((completedCnt / newTotal) * 100) : 0;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistObjectId,
      { totalVideos: newTotal, completedCount: completedCnt, progressPercent: progress },
      { new: true },
    ).lean();

    return sendSuccess(
      res,
      {
        playlist: { ...updatedPlaylist, id: updatedPlaylist._id.toString() },
        video:    { ...newVideo.toJSON() },
        alreadyEnrolled: false,
      },
      'Video enrolled successfully.',
      201,
    );
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/playlist/:id
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/:id', validate(updatePlaylistSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid playlist ID.', 400);

    const existing = await Playlist.findById(id).lean();
    if (!existing) return sendError(res, 'Playlist not found.', 404);
    if (existing.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    const data = {};
    if (req.body.name       !== undefined) data.name       = req.body.name;
    if (req.body.categoryId !== undefined) data.categoryId = req.body.categoryId ?? null;

    if (Object.keys(data).length === 0) return sendError(res, 'No fields provided to update.', 400);

    await Playlist.findByIdAndUpdate(id, data);
    const result = await populatePlaylist(id);

    return sendSuccess(res, result, 'Playlist updated successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/playlist/:id
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid playlist ID.', 400);

    const existing = await Playlist.findById(id).lean();
    if (!existing) return sendError(res, 'Playlist not found.', 404);
    if (existing.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    // Cascade delete videos and certificates
    await Promise.all([
      PlaylistVideo.deleteMany({ playlistId: id }),
      Certificate.deleteMany({ playlistId: id }),
      Playlist.findByIdAndDelete(id),
    ]);

    return sendSuccess(res, null, 'Playlist deleted successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/playlist/:id/videos
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/videos', validate(addVideoSchema), async (req, res, next) => {
  try {
    const { id: playlistId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(playlistId)) return sendError(res, 'Invalid playlist ID.', 400);

    const { youtubeVideoId, title, thumbnailUrl, channelTitle, durationSeconds, viewCount, likeCount } = req.body;

    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    const alreadyAdded = await PlaylistVideo.exists({ playlistId, youtubeVideoId });
    if (alreadyAdded) return sendError(res, 'This video is already in the playlist.', 409);

    const lastVideo = await PlaylistVideo.findOne({ playlistId }).sort({ sortOrder: -1 }).select('sortOrder').lean();
    const nextSortOrder = (lastVideo?.sortOrder ?? -1) + 1;

    await PlaylistVideo.create({
      playlistId,
      youtubeVideoId, title, thumbnailUrl, channelTitle,
      durationSeconds, viewCount: Number(viewCount ?? 0), likeCount: Number(likeCount ?? 0),
      sortOrder: nextSortOrder, isCompleted: false, watchedSeconds: 0,
    });

    const newTotal = await PlaylistVideo.countDocuments({ playlistId });
    await Playlist.findByIdAndUpdate(playlistId, {
      totalVideos: newTotal,
      progressPercent: calculateProgress(playlist.completedCount, newTotal),
    });

    const result = await populatePlaylist(playlistId);
    return sendSuccess(res, result, 'Video added to playlist.', 201);
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/playlist/:id/videos/:videoId
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/:id/videos/:videoId', async (req, res, next) => {
  try {
    const { id: playlistId, videoId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
      return sendError(res, 'Invalid ID.', 400);
    }

    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    const video = await PlaylistVideo.findById(videoId).lean();
    if (!video || video.playlistId.toString() !== playlistId) return sendError(res, 'Video not found in this playlist.', 404);

    await PlaylistVideo.findByIdAndDelete(videoId);

    const newTotal         = await PlaylistVideo.countDocuments({ playlistId });
    const remainingCompleted = await PlaylistVideo.countDocuments({ playlistId, isCompleted: true });
    const newProgress      = calculateProgress(remainingCompleted, newTotal);

    await Playlist.findByIdAndUpdate(playlistId, {
      totalVideos: newTotal, completedCount: remainingCompleted, progressPercent: newProgress,
    });

    const result = await populatePlaylist(playlistId);
    return sendSuccess(res, result, 'Video removed from playlist.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/playlist/:id/reorder
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/:id/reorder', validate(reorderSchema), async (req, res, next) => {
  try {
    const { id: playlistId } = req.params;
    const { videos }         = req.body;
    if (!mongoose.Types.ObjectId.isValid(playlistId)) return sendError(res, 'Invalid playlist ID.', 400);

    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist) return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id) return sendError(res, 'Permission denied.', 403);

    await Promise.all(
      videos.map(({ id, sortOrder }) =>
        PlaylistVideo.findOneAndUpdate(
          { _id: id, playlistId },
          { sortOrder },
        ),
      ),
    );

    const result = await populatePlaylist(playlistId);
    return sendSuccess(res, result, 'Playlist reordered successfully.');
  } catch (err) {
    return next(err);
  }
});

export default router;
