import { z } from 'zod';
import { objectId } from '../fields.js';

export const listCustomersSchema = z.object({
  params: z.object({ tenantId: objectId }),
  query: z.object({
    q: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const customerParamsSchema = z.object({
  params: z.object({
    tenantId: objectId,
    userId: objectId,
  }),
});
