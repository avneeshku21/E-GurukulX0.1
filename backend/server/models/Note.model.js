// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Note Model
// server/models/Note.model.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:          { type: String, enum: ['TEXT', 'CODE', 'QUIZ'], default: 'TEXT' },
    title:         { type: String, required: true, trim: true },
    content:       { type: String, default: '' },
    language:      { type: String, default: null },          // for CODE type
    linkedVideoId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlaylistVideo', default: null },
    playlistId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Playlist', default: null },
    tags:          [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, obj) {
        obj.id = obj._id.toString();
        if (obj.userId)        obj.userId        = obj.userId.toString();
        if (obj.linkedVideoId) obj.linkedVideoId = obj.linkedVideoId.toString();
        if (obj.playlistId)    obj.playlistId    = obj.playlistId.toString();
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

export default mongoose.model('Note', noteSchema);
