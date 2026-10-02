import { z } from 'zod';
import { isRealDate, isValidTimeZone } from '../utils/time.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const calendarDate = z.string().refine(isRealDate, 'Invalid date');

export const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time');

export const timeZone = z.string().trim().refine(isValidTimeZone, 'Invalid timezone');

export const email = z.string().trim().toLowerCase().pipe(z.email());
