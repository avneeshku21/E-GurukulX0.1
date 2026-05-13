// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – User Model
// server/models/User.model.js
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name:                { type: String, required: true, trim: true },
    email:               { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:        { type: String, default: null },
    avatarUrl:           { type: String, default: null },
    bio:                 { type: String, default: null },
    role:                { type: String, enum: ['STUDENT', 'ADMIN'], default: 'STUDENT' },
    emailVerified:       { type: Boolean, default: false },
    githubUrl:           { type: String, default: null },
    linkedinUrl:         { type: String, default: null },
    twitterUrl:          { type: String, default: null },
    currentStreak:       { type: Number, default: 0 },
    longestStreak:       { type: Number, default: 0 },
    lastActiveDate:      { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil:         { type: Date, default: null },
    isSuspended:         { type: Boolean, default: false },
    deletedAt:           { type: Date, default: null },
    // Selected interest categories (array of Category ObjectIds)
    categoryIds:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, obj) {
        obj.id = obj._id.toString();
        delete obj._id;
        delete obj.__v;
        delete obj.passwordHash;
        return obj;
      },
    },
  },
);

export default mongoose.model('User', userSchema);
