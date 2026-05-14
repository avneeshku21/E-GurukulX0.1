// ─────────────────────────────────────────────────────────────────────────────
// EduTrack – SavedContest Model  (per-student bookmarks + reminders)
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from 'mongoose';

const savedContestSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
    reminder:  { type: Boolean, default: false },          // true = send reminder
    reminderMinutesBefore: { type: Number, default: 30 },  // remind X min before start
    participated: { type: Boolean, default: false },
    notes: { type: String, default: '' },
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

savedContestSchema.index({ userId: 1, contestId: 1 }, { unique: true });
savedContestSchema.index({ userId: 1 });

export default mongoose.model('SavedContest', savedContestSchema);
