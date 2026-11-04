import mongoose from 'mongoose';

const { Schema } = mongoose;

/** ADMIN = super admin (samo ručno u bazi). PLATFORM_STAFF = djelatnik platforme (preko /admin). */
export const ROLES = ['CUSTOMER', 'BUSINESS_OWNER', 'STAFF', 'ADMIN', 'PLATFORM_STAFF'];

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
      // Optional when the account is Google-only.
      required: false,
      select: false,
    },
    /** Google subject (`sub`) — sparse unique so email/password users stay null. */
    googleId: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
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
    /** App chrome: follow OS, or force light / dark. */
    uiTheme: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    /** Privola za obradu podataka potrebnu za račun, rezervacije i članstvo. */
    privacyConsent: {
      accepted: { type: Boolean, default: false },
      version: { type: String, trim: true, default: '' },
      acceptedAt: { type: Date },
      withdrawnAt: { type: Date },
      source: { type: String, trim: true, maxlength: 40 },
    },
    /** Bump on logout / password change to invalidate existing JWTs. */
    tokenVersion: {
      type: Number,
      default: 0,
    },
  },
  {
    collection: 'users',
    timestamps: true,
  },
);

export default mongoose.model('User', userSchema);
