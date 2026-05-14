// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – Contest Model
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const contestSchema = new mongoose.Schema(
  {
    // ── Identity (from source API) ──────────────────────────────────────────
    externalId:   { type: String, required: true },          // clist/platform ID
    platform:     { type: String, required: true },          // 'codeforces', 'leetcode', etc.
    platformLabel: { type: String, required: true },         // Display name: 'Codeforces'
    platformLogo: { type: String, default: '' },             // URL to platform logo

    // ── Core info ───────────────────────────────────────────────────────────
    title:       { type: String, required: true },
    url:         { type: String, required: true },
    description: { type: String, default: '' },
    bannerUrl:   { type: String, default: '' },

    // ── Timing ──────────────────────────────────────────────────────────────
    startTime:    { type: Date, required: true },
    endTime:      { type: Date, required: true },
    durationSeconds: { type: Number, default: 0 },
    registrationDeadline: { type: Date, default: null },

    // ── Status (computed on fetch + re-evaluated on read) ───────────────────
    // 'upcoming' | 'live' | 'ended'
    status: {
      type: String,
      enum: ['upcoming', 'live', 'ended'],
      default: 'upcoming',
    },

    // ── Categorisation ──────────────────────────────────────────────────────
    // 'contest' | 'hackathon' | 'challenge' | 'internship' | 'aiml'
    type: {
      type: String,
      enum: ['contest', 'hackathon', 'challenge', 'internship', 'aiml', 'webdev'],
      default: 'contest',
    },
    tags:       { type: [String], default: [] },  // ['DSA','Python','WebDev',…]
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'any'], default: 'any' },

    // ── Meta ────────────────────────────────────────────────────────────────
    prizePool:         { type: String, default: '' },
    participantsCount: { type: Number, default: 0 },
    isFree:            { type: Boolean, default: true },
    isOnline:          { type: Boolean, default: true },
    mode:              { type: String, default: 'Online' },   // 'Online' | 'Offline' | 'Hybrid'
    country:           { type: String, default: '' },
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

// Ensure no duplicate contest from same platform
contestSchema.index({ externalId: 1, platform: 1 }, { unique: true });
contestSchema.index({ startTime: 1 });
contestSchema.index({ status: 1 });
contestSchema.index({ tags: 1 });

export default mongoose.model('Contest', contestSchema);
