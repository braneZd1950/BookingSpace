import mongoose from 'mongoose';

const { Schema } = mongoose;

export const MEMBERSHIP_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'];
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

const membershipSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    membershipPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    validFrom: {
      type: String,
      required: true,
      match: CALENDAR_DATE,
    },
    validUntil: {
      type: String,
      required: true,
      match: CALENDAR_DATE,
    },
    // Copied from the plan at purchase time. null means unlimited.
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
    sessionsUsed: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: MEMBERSHIP_STATUSES,
      default: 'ACTIVE',
      required: true,
    },
  },
  {
    collection: 'memberships',
    timestamps: true,
  },
);

membershipSchema.index({ tenantId: 1, userId: 1, status: 1 });

export default mongoose.model('Membership', membershipSchema);
