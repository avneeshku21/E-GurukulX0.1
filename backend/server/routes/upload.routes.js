// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Upload Routes
// server/routes/upload.routes.js
// Mounted at: /api/upload
// ─────────────────────────────────────────────────────────────────────────────

import { Router }         from 'express';
import multer             from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import User               from '../models/User.model.js';
import { verifyToken }    from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

const router = Router();

// ── Configure Cloudinary ─────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Multer: memory storage (no disk writes) ──────────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize:  2 * 1024 * 1024,   // 2 MB max
    files:     1,
  },
  fileFilter(_req, file, cb) {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      Object.assign(new Error('Only JPEG and PNG images are allowed.'), {
        statusCode: 415,
      }),
    );
  },
});

// ── Helper: upload buffer to Cloudinary via stream ───────────────────────────

function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });
    stream.end(buffer);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/upload/avatar
// Accepts: multipart/form-data with field "avatar"
// ─────────────────────────────────────────────────────────────────────────────

router.post(
  '/avatar',
  verifyToken,
  (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'File size must not exceed 2 MB.', 413);
        }
        return sendError(res, `Upload error: ${err.message}`, 400);
      }
      if (err) {
        return sendError(res, err.message, err.statusCode ?? 400);
      }
      return next();
    });
  },
  async (req, res, next) => {
    try {
      if (!req.file) {
        return sendError(res, 'No file received. Please attach an image with field name "avatar".', 400);
      }

      // Upload to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, {
        folder:         'edutrack/avatars',
        public_id:      req.user.id,                // overwrites previous avatar
        overwrite:      true,
        invalidate:     true,
        resource_type:  'image',
        transformation: [
          {
            width:   400,
            height:  400,
            crop:    'fill',
            gravity: 'face',
            quality: 80,
            fetch_format: 'webp',
          },
        ],
      });

      const avatarUrl = result.secure_url;

      // Persist new avatar URL to DB
      await User.findByIdAndUpdate(req.user.id, { avatarUrl });

      return sendSuccess(
        res,
        { avatarUrl },
        'Avatar uploaded successfully.',
      );
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
