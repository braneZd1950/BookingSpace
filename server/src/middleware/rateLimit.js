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
  const limiter = rateLimit({
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

  // Ephemeral e2e / unit API: dense matrices skip 429 noise by default.
  // Limits flood can opt in per-request via FORCE_RATE_LIMIT=1.
  return function maybeRateLimit(req, res, next) {
    if (
      process.env.FORCE_RATE_LIMIT !== '1'
      && (process.env.NODE_ENV === 'test' || process.env.E2E_DISABLE_RATE_LIMIT === '1')
    ) {
      next();
      return;
    }
    return limiter(req, res, next);
  };
}
