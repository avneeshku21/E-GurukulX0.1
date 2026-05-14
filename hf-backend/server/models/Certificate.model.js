// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Certificate Model
// server/models/Certificate.model.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    playlistId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist', required: true },
    certificateId: { type: String, required: true, unique: true },
    isRevoked:     { type: Boolean, default: false },
    revokedAt:     { type: Date, default: null },
    issuedAt:      { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, obj) {
        obj.id = obj._id.toString();
        if (obj.userId)     obj.userId     = obj.userId.toString();
        if (obj.playlistId) obj.playlistId = obj.playlistId.toString();
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

// One certificate per user per playlist
certificateSchema.index({ userId: 1, playlistId: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
