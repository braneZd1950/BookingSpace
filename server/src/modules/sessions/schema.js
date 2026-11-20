import { z } from 'zod';
import { calendarDate, clockTime, objectId } from '../fields.js';

export const availabilitySchema = z.object({
  params: z.object({
    tenantId: objectId,
    serviceId: objectId,
  }),
  query: z.object({
    date: calendarDate,
    from: clockTime.optional(),
    to: clockTime.optional(),
  }),
});

export const occupancySchema = z.object({
  params: z.object({
    tenantId: objectId,
  }),
  query: z.object({
    dateFrom: calendarDate,
    dateTo: calendarDate,
    serviceId: objectId.optional(),
  }),
});
