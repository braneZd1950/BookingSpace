import { z } from 'zod';
import { email, objectId } from '../fields.js';

export const createPlatformStaffSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    email,
    phone: z.string().trim().max(30).optional(),
    password: z.string().min(8).max(100).optional(),
  }),
});

export const updatePlatformStaffSchema = z.object({
  params: z.object({ staffId: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    password: z.string().min(8).max(100).optional(),
  }).refine((body) => Object.keys(body).length > 0, 'No changes'),
});

export const platformStaffParamsSchema = z.object({
  params: z.object({ staffId: objectId }),
});
