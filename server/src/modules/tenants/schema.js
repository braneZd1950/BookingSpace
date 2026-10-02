import { z } from 'zod';
import { NICHES, TEMPLATES, CAPACITY_MODELS } from '../../models/Tenant.js';
import { calendarDate, clockTime, email, objectId, timeZone } from '../fields.js';

const workingHour = z.object({
  day: z.number().int().min(0).max(6),
  closed: z.boolean().default(false),
  open: clockTime.optional(),
  close: clockTime.optional(),
});

const blockedPeriod = z.object({
  startDate: calendarDate,
  endDate: calendarDate,
  reason: z.string().trim().max(200).optional(),
});

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    niche: z.enum(NICHES),
    description: z.string().trim().max(2000).optional(),
    phone: z.string().trim().max(30).optional(),
    email: email.optional(),
    address: z.string().trim().max(200).optional(),
    timezone: timeZone.optional(),
    template: z.enum(TEMPLATES).optional(),
  }),
});

export const tenantParamsSchema = z.object({
  params: z.object({ tenantId: objectId }),
});

export const publicTenantSchema = z.object({
  params: z.object({
    slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }),
});

export const updateTenantSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    niche: z.enum(NICHES).optional(),
    description: z.string().trim().max(2000).optional(),
    phone: z.string().trim().max(30).optional(),
    email: email.optional(),
    address: z.string().trim().max(200).optional(),
    timezone: timeZone.optional(),
    active: z.boolean().optional(),
    bookingSettings: z.object({
      capacityModel: z.enum(CAPACITY_MODELS).optional(),
      workingHours: z.array(workingHour).max(7).optional(),
      blockedPeriods: z.array(blockedPeriod).max(100).optional(),
    }).optional(),
  }).refine((body) => Object.keys(body).length > 0, 'No changes'),
});

export const updateSiteSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    template: z.enum(TEMPLATES).optional(),
    theme: z.object({
      primaryColor: z.string().trim().max(30).optional(),
      secondaryColor: z.string().trim().max(30).optional(),
      fontFamily: z.string().trim().max(60).optional(),
      borderRadius: z.string().trim().max(20).optional(),
      buttonStyle: z.string().trim().max(30).optional(),
    }).optional(),
    visibleSections: z.object({
      hero: z.boolean().optional(),
      about: z.boolean().optional(),
      services: z.boolean().optional(),
      schedule: z.boolean().optional(),
      gallery: z.boolean().optional(),
      contact: z.boolean().optional(),
      location: z.boolean().optional(),
      openingHours: z.boolean().optional(),
    }).optional(),
    socialLinks: z.object({
      instagram: z.string().trim().max(200).optional(),
      facebook: z.string().trim().max(200).optional(),
      tiktok: z.string().trim().max(200).optional(),
      website: z.string().trim().max(200).optional(),
    }).optional(),
    seo: z.object({
      title: z.string().trim().max(120).optional(),
      description: z.string().trim().max(300).optional(),
    }).optional(),
  }).refine((body) => Object.keys(body).length > 0, 'No changes'),
});

export const uploadImageSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    purpose: z.enum(['logo', 'hero', 'gallery']),
  }),
});
