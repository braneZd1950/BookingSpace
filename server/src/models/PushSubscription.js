import mongoose from 'mongoose';

const { Schema } = mongoose;

const pushSubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, trim: true, maxlength: 400, default: '' },
    client: {
      type: String,
      enum: ['web', 'mobile'],
      default: 'web',
    },
  },
  {
    collection: 'push_subscriptions',
    timestamps: { createdAt: true, updatedAt: true },
  },
);

pushSubscriptionSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
