import rateLimit from 'express-rate-limit';
import { HttpError } from '../utils/httpError.js';

/**
 * Shared rate-limit factory so routes do not copy the same limiter boilerplate.
 * @param {{ windowMs: number, limit: number, message: string, keyByUser?: boolean }} options
 */
export function createRateLimiter({
  windowMs,
  limit,
  message,
  keyByUser = false,
}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    ...(keyByUser
      ? {
        validate: { keyGeneratorIpFallback: false },
        keyGenerator(req) {
          return String(req.user?._id || req.user?.id || req.ip);
        },
      }
      : {}),
    handler(req, res, next) {
      next(new HttpError(429, message, { code: 'TOO_MANY_REQUESTS' }));
    },
  });
}
