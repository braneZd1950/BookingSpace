import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import { cancel, complete, create, listForTenant, mine, noShow } from './controller.js';
import {
  bookingParamsSchema,
  createBookingSchema,
  myBookingsSchema,
  tenantBookingsSchema,
} from './schema.js';

const router = Router();

router.get('/my', requireAuth, validate(myBookingsSchema), mine);
router.post('/', requireAuth, validate(createBookingSchema), create);
router.patch('/:bookingId/cancel', requireAuth, validate(bookingParamsSchema), cancel);
router.patch('/:bookingId/complete', requireAuth, validate(bookingParamsSchema), complete);
router.patch('/:bookingId/no-show', requireAuth, validate(bookingParamsSchema), noShow);

const tenantRouter = Router({ mergeParams: true });
tenantRouter.get('/', requireAuth, validate(tenantBookingsSchema), requireTenantRole('BUSINESS_OWNER', 'STAFF'), listForTenant);

export { router as bookingRoutes, tenantRouter as tenantBookingRoutes };
