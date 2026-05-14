// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Notes Routes
// server/routes/notes.routes.js
// Mounted at: /api/notes
// ─────────────────────────────────────────────────────────────────────────────

import { Router }      from 'express';
import mongoose        from 'mongoose';
import Note            from '../models/Note.model.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validate }    from '../middleware/validate.middleware.js';
import { sendSuccess, sendError, sendPaginated, buildPagination } from '../utils/response.js';
import {
  createNoteSchema,
  updateNoteSchema,
} from '../validators/note.validator.js';

const router = Router();
router.use(verifyToken);

const NOTES_PER_PAGE = 20;

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notes
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const {
      type       = '',
      search     = '',
      playlistId = '',
      page       = '1',
    } = req.query;

    const currentPage = Math.max(1, parseInt(page, 10) || 1);

    const filter = { userId: req.user.id };

    if (type && ['TEXT', 'CODE', 'QUIZ'].includes(String(type).toUpperCase())) {
      filter.type = String(type).toUpperCase();
    }

    if (playlistId && mongoose.Types.ObjectId.isValid(playlistId)) {
      filter.playlistId = playlistId;
    }

    if (search) {
      const term = String(search).trim();
      filter.$or = [
        { title: { $regex: term, $options: 'i' } },
        { tags:  { $in: [new RegExp(term, 'i')] } },
      ];
    }

    const [totalItems, notes] = await Promise.all([
      Note.countDocuments(filter),
      Note.find(filter)
        .sort({ updatedAt: -1 })
        .skip((currentPage - 1) * NOTES_PER_PAGE)
        .limit(NOTES_PER_PAGE)
        .populate({ path: 'linkedVideoId', select: 'id youtubeVideoId title thumbnailUrl' })
        .populate({ path: 'playlistId',    select: 'id name' })
        .lean(),
    ]);

    const mapped = notes.map((n) => ({ ...n, id: n._id.toString(), _id: undefined, __v: undefined }));

    return sendPaginated(res, mapped, buildPagination(currentPage, NOTES_PER_PAGE, totalItems), 'Notes fetched successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notes
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', validate(createNoteSchema), async (req, res, next) => {
  try {
    const { type, title, content, language, linkedVideoId, playlistId, tags } = req.body;

    const note = await Note.create({
      userId:        req.user.id,
      type,
      title,
      content,
      language:      language      ?? null,
      linkedVideoId: linkedVideoId ?? null,
      playlistId:    playlistId    ?? null,
      tags:          tags          ?? [],
    });

    return sendSuccess(res, note.toJSON(), 'Note created successfully.', 201);
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notes/:id
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/:id', validate(updateNoteSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid note ID.', 400);

    const existing = await Note.findById(id).lean();
    if (!existing)                                           return sendError(res, 'Note not found.', 404);
    if (existing.userId.toString() !== req.user.id)         return sendError(res, 'Permission denied.', 403);

    const { type, title, content, language, linkedVideoId, playlistId, tags } = req.body;

    const data = {};
    if (type          !== undefined) data.type          = type;
    if (title         !== undefined) data.title         = title;
    if (content       !== undefined) data.content       = content;
    if (language      !== undefined) data.language      = language      ?? null;
    if (linkedVideoId !== undefined) data.linkedVideoId = linkedVideoId ?? null;
    if (playlistId    !== undefined) data.playlistId    = playlistId    ?? null;
    if (tags          !== undefined) data.tags          = tags;

    if (Object.keys(data).length === 0) return sendError(res, 'No fields provided to update.', 400);

    const updated = await Note.findByIdAndUpdate(id, data, { new: true }).lean();
    return sendSuccess(res, { ...updated, id: updated._id.toString(), _id: undefined, __v: undefined }, 'Note updated successfully.');
  } catch (err) {
    return next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/notes/:id
// ─────────────────────────────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 'Invalid note ID.', 400);

    const existing = await Note.findById(id).lean();
    if (!existing)                                   return sendError(res, 'Note not found.', 404);
    if (existing.userId.toString() !== req.user.id)  return sendError(res, 'Permission denied.', 403);

    await Note.findByIdAndDelete(id);
    return sendSuccess(res, null, 'Note deleted successfully.');
  } catch (err) {
    return next(err);
  }
});

export default router;
