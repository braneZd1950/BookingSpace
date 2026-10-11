import mongoose from 'mongoose';

const { Schema } = mongoose;

export const USAGE_EVENT_TYPES = [
  'page_view',
  'login_success',
  'register_success',
  'member_created',
  'booking_created',
  'booking_cancelled',
  'password_reset_requested',
];

const usageEventSchema = new Schema(
  {
    type: {
      type: String,
      enum: USAGE_EVENT_TYPES,
      required: true,
      index: true,
    },
    path: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    role: {
      type: String,
      trim: true,
      maxlength: 40,
    },
  },
  {
    collection: 'usage_events',
    timestamps: { createdAt: true, updatedAt: false },
  },
);

usageEventSchema.index({ createdAt: -1 });
usageEventSchema.index({ type: 1, createdAt: -1 });
usageEventSchema.index({ tenantId: 1, type: 1, createdAt: -1 });

export default mongoose.model('UsageEvent', usageEventSchema);
