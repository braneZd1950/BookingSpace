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
