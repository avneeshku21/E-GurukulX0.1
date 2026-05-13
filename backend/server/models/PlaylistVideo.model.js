// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – PlaylistVideo Model
// server/models/PlaylistVideo.model.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const playlistVideoSchema = new mongoose.Schema(
  {
    playlistId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist', required: true, index: true },
    youtubeVideoId:  { type: String, required: true, trim: true },
    title:           { type: String, required: true, trim: true },
    thumbnailUrl:    { type: String, default: '' },
    channelTitle:    { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    viewCount:       { type: Number, default: 0 },
    likeCount:       { type: Number, default: 0 },
    sortOrder:       { type: Number, default: 0 },
    isCompleted:     { type: Boolean, default: false },
    completedAt:     { type: Date, default: null },
    watchedSeconds:  { type: Number, default: 0 },
    lastWatchedAt:   { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, obj) {
        obj.id = obj._id.toString();
        if (obj.playlistId) obj.playlistId = obj.playlistId.toString();
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

// Compound unique index: a YouTube video can only appear once per playlist
playlistVideoSchema.index({ playlistId: 1, youtubeVideoId: 1 }, { unique: true });

export default mongoose.model('PlaylistVideo', playlistVideoSchema);
