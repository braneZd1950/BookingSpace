import { z } from 'zod';
import { BILLING_PLANS, BILLING_STATUSES } from '../../models/Tenant.js';
import { USAGE_EVENT_TYPES } from '../../models/UsageEvent.js';
import { calendarDate, objectId } from '../fields.js';

export const trackEventSchema = z.object({
  body: z.object({
    type: z.enum(['page_view']),
    path: z.string().trim().min(1).max(200),
    tenantId: objectId.optional(),
  }),
});

export const platformSummarySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(90).default(30),
  }),
});

export const platformActivitySchema = z.object({
  query: z.object({
    days: z.coerce.number().int().min(1).max(90).default(7),
    type: z.enum([
      'all',
      'actions',
      'page_view',
      'login_success',
      'register_success',
      'tenant_created',
      'member_created',
      'booking_created',
      'booking_cancelled',
      'booking_completed',
      'booking_no_show',
      'password_reset_requested',
    ]).default('actions'),
    limit: z.coerce.number().int().min(1).max(200).default(100),
  }),
});

export const studioSummarySchema = z.object({
  params: z.object({ tenantId: objectId }),
  query: z.object({
    days: z.coerce.number().int().min(1).max(90).default(30),
  }),
});

export const allowedClientTypes = USAGE_EVENT_TYPES.filter((type) => type === 'page_view');

export const billingTenantParamsSchema = z.object({
  params: z.object({ tenantId: objectId }),
});

export const updateBillingSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    status: z.enum(BILLING_STATUSES).optional(),
    plan: z.enum(BILLING_PLANS).optional(),
    validUntil: calendarDate.nullable().optional(),
    amount: z.number().min(0).optional(),
    currency: z.string().trim().min(3).max(3).optional(),
    note: z.string().trim().max(500).optional(),
    markPaid: z.boolean().optional(),
  }).refine((body) => Object.keys(body).length > 0, 'No changes'),
});
