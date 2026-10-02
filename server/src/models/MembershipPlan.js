import mongoose from 'mongoose';

const { Schema } = mongoose;

const membershipPlanSchema = new Schema(
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    validityDays: {
      type: Number,
      required: true,
      min: 1,
    },
    // null means unlimited sessions for the validity period.
    sessionsIncluded: {
      type: Number,
      default: null,
      validate: {
        validator(value) {
          return value == null || (Number.isInteger(value) && value >= 1);
        },
        message: 'sessionsIncluded must be a positive integer or null for unlimited',
      },
    },
    allowedServiceIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'membershipPlans',
    timestamps: true,
  },
);

membershipPlanSchema.index({ tenantId: 1, active: 1 });

export default mongoose.model('MembershipPlan', membershipPlanSchema);
