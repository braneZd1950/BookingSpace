import { z } from 'zod';
import { email } from '../fields.js';

const password = z.string().min(8).max(72);

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    email,
    password,
    phone: z.string().trim().max(30).optional(),
    role: z.enum(['CUSTOMER', 'BUSINESS_OWNER']).default('CUSTOMER'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1).max(72),
  }),
});

const notificationPrefsSchema = z.object({
  bookingEmail: z.boolean().optional(),
  cancelEmail: z.boolean().optional(),
  memberEmail: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  marketing: z.boolean().optional(),
  bookingPush: z.boolean().optional(),
  cancelPush: z.boolean().optional(),
  memberPush: z.boolean().optional(),
  reminderPush: z.boolean().optional(),
}).strict();

const privacyConsentUpdateSchema = z.object({
  action: z.enum(['accept', 'withdraw']),
  version: z.string().trim().min(1).max(40).optional(),
  source: z.enum(['banner', 'settings', 'register']).optional(),
  path: z.string().trim().max(200).optional(),
}).strict();

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    email: email.optional(),
    phone: z.string().trim().max(30).optional(),
    notificationPrefs: notificationPrefsSchema.optional(),
    privacyConsent: privacyConsentUpdateSchema.optional(),
  }).refine((body) => Object.keys(body).length > 0, 'No changes'),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1).max(72),
    newPassword: password,
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().trim().min(20).max(200),
    password,
  }),
});
