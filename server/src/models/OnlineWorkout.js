import mongoose from 'mongoose';

const { Schema } = mongoose;

const onlineWorkoutSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    /** Cloudinary / local / YouTube / Vimeo playback URL. */
    videoUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    /** Cloudinary public_id when uploaded through our API. */
    videoPublicId: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    durationMinutes: {
      type: Number,
      min: 1,
      max: 300,
      default: 30,
    },
    /** Price in EUR when member has no remaining in-studio sessions. */
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    collection: 'onlineWorkouts',
    timestamps: true,
  },
);

onlineWorkoutSchema.index({ tenantId: 1, active: 1, createdAt: -1 });

export default mongoose.model('OnlineWorkout', onlineWorkoutSchema);
