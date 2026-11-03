import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { HttpError } from '../../utils/httpError.js';
import { requireTenantRole } from '../access.js';
import { cancel, complete, create, listForTenant, mine, noShow } from './controller.js';
import {
  bookingParamsSchema,
  createBookingSchema,
  myBookingsSchema,
  tenantBookingsSchema,
} from './schema.js';

const createBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator(req) {
    return String(req.user?._id || req.ip);
  },
  handler(req, res, next) {
    next(new HttpError(429, 'Too many booking attempts. Try again later.', {
      code: 'TOO_MANY_REQUESTS',
    }));
  },
});

const router = Router();

router.get('/my', requireAuth, validate(myBookingsSchema), mine);
router.post('/', requireAuth, createBookingLimiter, validate(createBookingSchema), create);
router.patch('/:bookingId/cancel', requireAuth, validate(bookingParamsSchema), cancel);
router.patch('/:bookingId/complete', requireAuth, validate(bookingParamsSchema), complete);
router.patch('/:bookingId/no-show', requireAuth, validate(bookingParamsSchema), noShow);

const tenantRouter = Router({ mergeParams: true });
tenantRouter.get('/', requireAuth, validate(tenantBookingsSchema), requireTenantRole('BUSINESS_OWNER', 'STAFF'), listForTenant);

export { router as bookingRoutes, tenantRouter as tenantBookingRoutes };
