// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Playlist Validators
// server/validators/playlist.validator.js
// ─────────────────────────────────────────────────────────────────────────────

import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// createPlaylistSchema
// ─────────────────────────────────────────────────────────────────────────────

export const createPlaylistSchema = z.object({
  name: z
    .string()
    .min(1, 'Playlist name is required.')
    .max(100, 'Playlist name must be at most 100 characters.')
    .trim(),

  categoryId: z
    .string()
    .uuid('categoryId must be a valid UUID.')
    .optional()
    .nullable(),
});

// ─────────────────────────────────────────────────────────────────────────────
// updatePlaylistSchema — all fields optional (partial)
// ─────────────────────────────────────────────────────────────────────────────

export const updatePlaylistSchema = createPlaylistSchema.partial();

// ─────────────────────────────────────────────────────────────────────────────
// addVideoSchema — metadata for a YouTube video being added to a playlist
// ─────────────────────────────────────────────────────────────────────────────

export const addVideoSchema = z.object({
  youtubeVideoId: z
    .string()
    .min(5, 'YouTube video ID must be at least 5 characters.')
    .trim(),

  title: z
    .string()
    .min(1, 'Video title is required.')
    .max(500, 'Video title must be at most 500 characters.')
    .trim(),

  thumbnailUrl: z
    .string()
    .url('thumbnailUrl must be a valid URL.'),

  channelTitle: z
    .string()
    .min(1, 'Channel title is required.')
    .max(200, 'Channel title must be at most 200 characters.')
    .trim(),

  durationSeconds: z
    .number({ invalid_type_error: 'durationSeconds must be a number.' })
    .int('durationSeconds must be an integer.')
    .nonnegative('durationSeconds must be 0 or greater.'),

  viewCount: z
    .number({ invalid_type_error: 'viewCount must be a number.' })
    .int('viewCount must be an integer.')
    .nonnegative('viewCount must be 0 or greater.')
    .default(0),

  likeCount: z
    .number({ invalid_type_error: 'likeCount must be a number.' })
    .int('likeCount must be an integer.')
    .nonnegative('likeCount must be 0 or greater.')
    .default(0),
});

// ─────────────────────────────────────────────────────────────────────────────
// reorderSchema — array of { id, sortOrder } pairs to reorder playlist videos
// ─────────────────────────────────────────────────────────────────────────────

export const reorderSchema = z.object({
  videos: z
    .array(
      z.object({
        id: z
          .string()
          .uuid('Each video ID must be a valid UUID.'),

        sortOrder: z
          .number({ invalid_type_error: 'sortOrder must be a number.' })
          .int('sortOrder must be an integer.')
          .nonnegative('sortOrder must be 0 or greater.'),
      }),
    )
    .min(1, 'At least one video entry is required.'),
});
