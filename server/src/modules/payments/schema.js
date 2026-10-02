import { z } from 'zod';
import { PAYMENT_METHODS } from '../../models/Payment.js';
import { objectId } from '../fields.js';

export const listPaymentsSchema = z.object({
  params: z.object({ tenantId: objectId }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const createPaymentSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    userId: objectId,
    membershipId: objectId.optional(),
    amount: z.number().min(0),
    method: z.enum(PAYMENT_METHODS),
    note: z.string().trim().max(500).optional(),
    paidAt: z.string().datetime().optional(),
  }),
});
