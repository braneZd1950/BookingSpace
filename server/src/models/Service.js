import mongoose from 'mongoose';

const { Schema } = mongoose;

const serviceSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    slotIntervalMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    cancellationWindowMinutes: {
      type: Number,
      required: true,
      min: 0,
      default: 15,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    membershipRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    collection: 'services',
    timestamps: true,
  },
);

serviceSchema.index({ tenantId: 1, active: 1 });

export default mongoose.model('Service', serviceSchema);
