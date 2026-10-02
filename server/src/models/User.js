import mongoose from 'mongoose';

const { Schema } = mongoose;

export const ROLES = ['CUSTOMER', 'BUSINESS_OWNER', 'STAFF', 'ADMIN'];

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'CUSTOMER',
      required: true,
    },
  },
  {
    collection: 'users',
    timestamps: true,
  },
);

export default mongoose.model('User', userSchema);
