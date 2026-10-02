import { z } from 'zod';
import { objectId } from '../fields.js';

const serviceBody = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional(),
  durationMinutes: z.number().int().min(1).max(24 * 60),
  slotIntervalMinutes: z.number().int().min(1).max(24 * 60),
  capacity: z.number().int().min(1).max(500),
  cancellationWindowMinutes: z.number().int().min(0).max(7 * 24 * 60).default(15),
  price: z.number().min(0),
  membershipRequired: z.boolean().default(false),
  active: z.boolean().optional(),
});

export const listServicesSchema = z.object({
  params: z.object({ tenantId: objectId }),
});

export const createServiceSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: serviceBody,
});

export const updateServiceSchema = z.object({
  params: z.object({ serviceId: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(2000).optional(),
    durationMinutes: z.number().int().min(1).max(24 * 60).optional(),
    slotIntervalMinutes: z.number().int().min(1).max(24 * 60).optional(),
    capacity: z.number().int().min(1).max(500).optional(),
    cancellationWindowMinutes: z.number().int().min(0).max(7 * 24 * 60).optional(),
    price: z.number().min(0).optional(),
    membershipRequired: z.boolean().optional(),
    active: z.boolean().optional(),
  }).refine((body) => Object.keys(body).length > 0, 'No changes'),
});

export const serviceParamsSchema = z.object({
  params: z.object({ serviceId: objectId }),
});
