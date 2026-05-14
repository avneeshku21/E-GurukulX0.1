// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Note Validators
// server/validators/note.validator.js
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// createNoteSchema
// ─────────────────────────────────────────────────────────────────────────────

export const createNoteSchema = z.object({
  type: z.enum(['TEXT', 'CODE', 'QUIZ'], {
    errorMap: () => ({ message: "Note type must be 'TEXT', 'CODE', or 'QUIZ'." }),
  }),

  title: z
    .string()
    .min(1, 'Note title is required.')
    .max(200, 'Note title must be at most 200 characters.')
    .trim(),

  // JSON-serialised editor content (TipTap doc, Monaco code, quiz array)
  content: z
    .string()
    .min(1, 'Note content is required.'),

  // Only relevant for CODE notes (e.g. 'javascript', 'python')
  language: z
    .string()
    .max(50, 'Language identifier must be at most 50 characters.')
    .trim()
    .optional(),

  // MongoDB ObjectId of the PlaylistVideo this note is linked to
  linkedVideoId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'linkedVideoId must be a valid ObjectId.')
    .optional()
    .nullable(),

  // MongoDB ObjectId of the parent Playlist
  playlistId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'playlistId must be a valid ObjectId.')
    .optional()
    .nullable(),

  tags: z
    .array(
      z
        .string()
        .max(30, 'Each tag must be at most 30 characters.')
        .trim(),
    )
    .max(10, 'You may add at most 10 tags.')
    .default([]),
});

// ─────────────────────────────────────────────────────────────────────────────
// updateNoteSchema — all fields optional (partial)
// ─────────────────────────────────────────────────────────────────────────────

export const updateNoteSchema = createNoteSchema.partial();
