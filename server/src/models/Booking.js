import mongoose from 'mongoose';

const { Schema } = mongoose;

export const BOOKING_STATUSES = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
export const BOOKING_SOURCES = ['CUSTOMER', 'STAFF'];
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLOCK_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const bookingSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
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
    date: {
      type: String,
      required: true,
      match: CALENDAR_DATE,
    },
    startTime: {
      type: String,
      required: true,
      match: CLOCK_TIME,
    },
    endTime: {
      type: String,
      required: true,
      match: CLOCK_TIME,
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'CONFIRMED',
      required: true,
    },
    source: {
      type: String,
      enum: BOOKING_SOURCES,
      default: 'CUSTOMER',
      required: true,
    },
    cancelledAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    collection: 'bookings',
    timestamps: true,
  },
);

bookingSchema.index({
  tenantId: 1,
  date: 1,
  startTime: 1,
  serviceId: 1,
  status: 1,
});

bookingSchema.index(
  { tenantId: 1, serviceId: 1, userId: 1, date: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: 'CONFIRMED' } },
);

export default mongoose.model('Booking', bookingSchema);
