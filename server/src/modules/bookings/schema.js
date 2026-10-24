import { z } from 'zod';
import { calendarDate, clockTime, objectId } from '../fields.js';

export const createBookingSchema = z.object({
  body: z.object({
    serviceId: objectId,
    date: calendarDate,
    startTime: clockTime,
    userId: objectId.optional(),
    staffId: objectId.optional(),
  }),
});

export const myBookingsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const tenantBookingsSchema = z.object({
  params: z.object({ tenantId: objectId }),
  query: z.object({
    date: calendarDate.optional(),
    dateFrom: calendarDate.optional(),
    dateTo: calendarDate.optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  }),
});

export const bookingParamsSchema = z.object({
  params: z.object({ bookingId: objectId }),
});
