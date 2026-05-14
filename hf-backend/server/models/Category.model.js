// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Category Model
// server/models/Category.model.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    slug:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    description:  { type: String, default: '' },
    icon:         { type: String, default: '📚' },
    color:        { type: String, default: '#6366f1' },
    youtubeQuery: { type: String, default: '' },
    isActive:     { type: Boolean, default: true },
    videoCount:   { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, obj) {
        obj.id = obj._id.toString();
        delete obj._id;
        delete obj.__v;
        return obj;
      },
    },
  },
);

export default mongoose.model('Category', categorySchema);
