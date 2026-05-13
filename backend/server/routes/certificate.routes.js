// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Certificate Routes
// server/routes/certificate.routes.js
// Mounted at: /api/certificate
// ─────────────────────────────────────────────────────────────────────────────

import { Router }      from 'express';
import mongoose        from 'mongoose';
import Certificate     from '../models/Certificate.model.js';
import Playlist        from '../models/Playlist.model.js';
import User            from '../models/User.model.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { generateCertificateId }  from '../utils/hash.js';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/certificate
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', verifyToken, async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ userId: req.user.id, isRevoked: false })
      .sort({ issuedAt: -1 })
      .populate({
        path:   'playlistId',
        select: 'id name totalVideos categoryId',
        populate: { path: 'categoryId', select: 'id name icon color' },
      })
      .lean();

    const mapped = certificates.map((c) => ({
      ...c,
      id: c._id.toString(),
      _id: undefined,
      __v: undefined,
      playlist: c.playlistId ? { ...c.playlistId, id: c.playlistId._id?.toString(), _id: undefined } : null,
      playlistId: undefined,
    }));

    return sendSuccess(res, mapped, 'Certificates fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/certificate/verify/:certificateId  (public)
// ─────────────────────────────────────────────────────────────────────────────

router.get('/verify/:certificateId', async (req, res, next) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findOne({ certificateId: String(certificateId) })
      .populate({ path: 'userId',     select: 'id name avatarUrl' })
      .populate({
        path:   'playlistId',
        select: 'id name totalVideos categoryId',
        populate: { path: 'categoryId', select: 'id name icon' },
      })
      .lean();

    if (!certificate) return sendError(res, 'Certificate not found.', 404);

    if (certificate.isRevoked) {
      return res.status(200).json({
        success: true,
        data: {
          valid: false, isRevoked: true,
          certificateId: certificate.certificateId,
          issuedAt:      certificate.issuedAt,
          revokedAt:     certificate.revokedAt,
        },
        message: 'This certificate has been revoked.',
      });
    }

    return sendSuccess(res, {
      valid:         true,
      isRevoked:     false,
      certificateId: certificate.certificateId,
      issuedAt:      certificate.issuedAt,
      student:       certificate.userId ? { ...certificate.userId, id: certificate.userId._id?.toString() } : null,
      playlist:      certificate.playlistId ? { ...certificate.playlistId, id: certificate.playlistId._id?.toString() } : null,
    }, 'Certificate is valid.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/certificate  (manual issue for 100% playlists)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { playlistId } = req.body;
    if (!playlistId) return sendError(res, 'playlistId is required.', 400);
    if (!mongoose.Types.ObjectId.isValid(playlistId)) return sendError(res, 'Invalid playlist ID.', 400);

    const playlist = await Playlist.findById(playlistId).lean();
    if (!playlist)                                      return sendError(res, 'Playlist not found.', 404);
    if (playlist.userId.toString() !== req.user.id)    return sendError(res, 'Permission denied.', 403);
    if (playlist.progressPercent < 100) {
      return sendError(res, `Playlist is only ${playlist.progressPercent}% complete. You need 100% to earn a certificate.`, 400);
    }

    const existing = await Certificate.findOne({ userId: req.user.id, playlistId }).lean();
    if (existing) {
      return sendSuccess(res, { ...existing, id: existing._id.toString(), _id: undefined, __v: undefined }, 'Certificate already issued for this playlist.');
    }

    const certId      = generateCertificateId();
    const certificate = await Certificate.create({
      userId:        req.user.id,
      playlistId,
      certificateId: certId,
    });

    await Playlist.findByIdAndUpdate(playlistId, { certificateIssued: true });

    return sendSuccess(res, certificate.toJSON(), 'Certificate issued successfully.', 201);
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Certificate.findOne({ userId: req.user.id, playlistId: req.body.playlistId }).lean();
      return sendSuccess(res, { ...existing, id: existing._id.toString() }, 'Certificate already issued.');
    }
    return next(err);
  }
});

export default router;
