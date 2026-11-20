import { Router } from 'express';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { occupancy } from './controller.js';
import { occupancySchema } from './schema.js';

const occupancyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  message: 'Too many occupancy requests. Try again later.',
});

const router = Router({ mergeParams: true });
router.get('/', occupancyLimiter, validate(occupancySchema), occupancy);

export default router;
