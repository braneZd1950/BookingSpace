import mongoose from 'mongoose';

const { Schema } = mongoose;

export const TENANT_ROLES = ['BUSINESS_OWNER', 'STAFF', 'CUSTOMER'];
export const TENANT_USER_STATUSES = ['ACTIVE', 'INVITED', 'SUSPENDED'];

const tenantUserSchema = new Schema(
  {
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
    role: {
      type: String,
      enum: TENANT_ROLES,
      required: true,
    },
    status: {
      type: String,
      enum: TENANT_USER_STATUSES,
      default: 'ACTIVE',
      required: true,
    },
    /** Optional display title for trainers (e.g. Trener, Instruktor). */
    title: {
      type: String,
      trim: true,
      maxlength: 60,
    },
  },
  {
    collection: 'tenantUsers',
    timestamps: { createdAt: true, updatedAt: false },
  },
);

tenantUserSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export default mongoose.model('TenantUser', tenantUserSchema);
