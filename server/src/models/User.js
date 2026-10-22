import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ROLES = ['CUSTOMER', 'BUSINESS_OWNER', 'STAFF', 'ADMIN'];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'CUSTOMER',
      required: true,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    notificationPrefs: {
      bookingEmail: { type: Boolean, default: true },
      cancelEmail: { type: Boolean, default: true },
      memberEmail: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false },
      bookingPush: { type: Boolean, default: true },
      cancelPush: { type: Boolean, default: true },
      memberPush: { type: Boolean, default: true },
      reminderPush: { type: Boolean, default: false },
    },
    /** Privola za obradu podataka potrebnu za račun, rezervacije i članstvo. */
    privacyConsent: {
      accepted: { type: Boolean, default: false },
      version: { type: String, trim: true, default: '' },
      acceptedAt: { type: Date },
      withdrawnAt: { type: Date },
      source: { type: String, trim: true, maxlength: 40 },
    },
  },
  {
    collection: 'users',
    timestamps: true,
  },
);

export default mongoose.model('User', userSchema);
