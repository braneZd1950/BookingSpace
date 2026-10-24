import { z } from 'zod';
import { email, objectId } from '../fields.js';

export const tenantStaffParamsSchema = z.object({
  params: z.object({ tenantId: objectId }),
});

export const createStaffSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(80),
    email,
    phone: z.string().trim().max(30).optional(),
    title: z.string().trim().max(60).optional(),
  }),
});

export const staffMemberParamsSchema = z.object({
  params: z.object({
    tenantId: objectId,
    userId: objectId,
  }),
});
