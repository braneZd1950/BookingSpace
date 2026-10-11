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

export const updateMeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    email: email.optional(),
    phone: z.string().trim().max(30).optional(),
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
