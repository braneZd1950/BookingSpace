import { z } from 'zod';
import { objectId } from '../fields.js';

const videoUrl = z.string().trim().min(1).max(500).refine(
  (value) => /^https?:\/\//i.test(value) || value.startsWith('/uploads/'),
  'Invalid video url',
);

export const tenantOnlineParamsSchema = z.object({
  params: z.object({ tenantId: objectId }),
});

export const createOnlineSchema = z.object({
  params: z.object({ tenantId: objectId }),
  body: z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    videoUrl,
    videoPublicId: z.string().trim().max(200).optional(),
    durationMinutes: z.number().int().min(1).max(300).optional(),
    price: z.number().min(0).max(9999).optional(),
    active: z.boolean().optional(),
  }),
});

export const updateOnlineSchema = z.object({
  params: z.object({
    tenantId: objectId,
    workoutId: objectId,
  }),
  body: z.object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    videoUrl: videoUrl.optional(),
    videoPublicId: z.string().trim().max(200).optional(),
    durationMinutes: z.number().int().min(1).max(300).optional(),
    price: z.number().min(0).max(9999).optional(),
    active: z.boolean().optional(),
  }),
});

export const onlineItemParamsSchema = z.object({
  params: z.object({
    tenantId: objectId,
    workoutId: objectId,
  }),
});
