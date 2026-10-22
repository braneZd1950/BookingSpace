import mongoose from 'mongoose';

const { Schema } = mongoose;

const consentEventSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    anonymousKey: {
      type: String,
      trim: true,
      maxlength: 80,
      index: true,
    },
    action: {
      type: String,
      enum: ['accept', 'withdraw'],
      required: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 40,
      default: 'banner',
    },
    path: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  {
    collection: 'consent_events',
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export default mongoose.model('ConsentEvent', consentEventSchema);
