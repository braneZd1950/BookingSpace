import { z } from 'zod';
import { PAYMENT_METHODS } from '../../models/Payment.js';
import { calendarDate, email, objectId } from '../fields.js';

const planBody = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0),
  validityDays: z.number().int().min(1).max(3650),
  sessionsIncluded: z.number().int().min(1).nullable().optional(),
  allowedServiceIds: z.array(objectId).max(50).optional(),
  active: z.boolean().optional(),
});

export const listPlansSchema = z.object({
  params: z.object({ tenantId: objectId }),
});

export const createPlanSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: planBody,
});

export const updatePlanSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(2000).optional(),
    price: z.number().min(0).optional(),
    validityDays: z.number().int().min(1).max(3650).optional(),
    sessionsIncluded: z.number().int().min(1).nullable().optional(),
    allowedServiceIds: z.array(objectId).max(50).optional(),
    active: z.boolean().optional(),
  }).refine((body) => Object.keys(body).length > 0, 'No changes'),
});

const customer = z.object({
  name: z.string().trim().min(1).max(80),
  email,
  phone: z.string().trim().max(30).optional(),
});

export const createMembershipSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    userId: objectId.optional(),
    customer: customer.optional(),
    membershipPlanId: objectId,
    validFrom: calendarDate.optional(),
    amount: z.number().min(0).optional(),
    method: z.enum(PAYMENT_METHODS),
    note: z.string().trim().max(500).optional(),
    paidAt: z.string().datetime().optional(),
  }).refine((body) => body.userId || body.customer, 'Customer is required'),
});

export const listMembershipsSchema = z.object({
  params: z.object({ tenantId: objectId }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const myMembershipsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const suspendMembershipSchema = z.object({
  params: z.object({ id: objectId }),
});
