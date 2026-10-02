import mongoose from 'mongoose';

const { Schema } = mongoose;

export const PAYMENT_METHODS = ['CASH', 'CARD_TERMINAL', 'BANK_TRANSFER', 'ONLINE'];
export const PAYMENT_STATUSES = ['PAID', 'VOID'];

const paymentSchema = new Schema(
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
    membershipId: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      default: 'EUR',
    },
    method: {
      type: String,
      enum: PAYMENT_METHODS,
      required: true,
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PAID',
      required: true,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    collection: 'payments',
    timestamps: { createdAt: true, updatedAt: false },
  },
);

paymentSchema.index({ tenantId: 1, paidAt: -1 });

export default mongoose.model('Payment', paymentSchema);
