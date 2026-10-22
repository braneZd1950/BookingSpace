import { z } from 'zod';

export const subscribePushSchema = {
  body: z.object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
      p256dh: z.string().min(1).max(512),
      auth: z.string().min(1).max(512),
    }),
    client: z.enum(['web', 'mobile']).optional(),
  }),
};

export const unsubscribePushSchema = {
  body: z.object({
    endpoint: z.string().url().max(2048),
  }),
};
