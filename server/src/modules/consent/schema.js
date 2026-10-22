import { z } from 'zod';

export const CONSENT_VERSION = '2026-10-13';

export const recordConsentSchema = z.object({
  body: z.object({
    action: z.enum(['accept', 'withdraw']),
    version: z.string().trim().min(1).max(40).default(CONSENT_VERSION),
    source: z.enum(['banner', 'settings', 'register']).default('banner'),
    path: z.string().trim().max(200).optional(),
    anonymousKey: z.string().trim().min(8).max(80).optional(),
  }),
});
