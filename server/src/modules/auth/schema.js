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
