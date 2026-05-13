// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Playlist Model
// server/models/Playlist.model.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema(
  {
    userId:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:              { type: String, required: true, trim: true },
    description:       { type: String, default: '' },
    thumbnailUrl:      { type: String, default: null },
    categoryId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    totalVideos:       { type: Number, default: 0 },
    completedCount:    { type: Number, default: 0 },
    progressPercent:   { type: Number, default: 0 },
    certificateIssued: { type: Boolean, default: false },
    isCompleted:       { type: Boolean, default: false },
    completedAt:       { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, obj) {
        obj.id = obj._id.toString();
        if (obj.userId)     obj.userId     = obj.userId.toString();
        if (obj.categoryId) obj.categoryId = obj.categoryId.toString();
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

export default mongoose.model('Playlist', playlistSchema);
