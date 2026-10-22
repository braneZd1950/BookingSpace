import mongoose from 'mongoose';

const { Schema } = mongoose;

export const STAFF_NOTIFICATION_TYPES = [
  'booking_created',
  'booking_cancelled',
  'member_created',
];

const staffNotificationSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: STAFF_NOTIFICATION_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    channel: {
      type: String,
      enum: ['push', 'email', 'in_app'],
      default: 'push',
    },
    readAt: { type: Date },
    deliveredAt: { type: Date },
  },
  {
    collection: 'staff_notifications',
    timestamps: { createdAt: true, updatedAt: false },
  },
);

staffNotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('StaffNotification', staffNotificationSchema);
