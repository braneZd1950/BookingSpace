import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { HttpError } from '../../utils/httpError.js';
import {
  platformActivityHandler,
  platformBillingHandler,
  platformBillingInvoiceHandler,
  platformBillingUpdateHandler,
  platformBillingWarnHandler,
  platformExportSealHandler,
  platformExportVerifyHandler,
  platformHandler,
  platformReportsHandler,
  platformStudiosHandler,
  platformSystemHandler,
  platformUsersHandler,
  studioHandler,
  trackHandler,
} from './controller.js';
import {
  billingTenantParamsSchema,
  exportSealSchema,
  exportVerifySchema,
  platformActivitySchema,
  platformSummarySchema,
  studioSummarySchema,
  trackEventSchema,
  updateBillingSchema,
} from './schema.js';

const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res, next) {
    next(new HttpError(429, 'Too many attempts. Try again later.', {
      code: 'TOO_MANY_REQUESTS',
    }));
  },
});

const router = Router();

router.post('/events', trackLimiter, validate(trackEventSchema), trackHandler);
router.get('/platform', requireAuth, validate(platformSummarySchema), platformHandler);
router.get(
  '/platform/studios',
  requireAuth,
  validate(platformSummarySchema),
  platformStudiosHandler,
);
router.get(
  '/platform/users',
  requireAuth,
  validate(platformSummarySchema),
  platformUsersHandler,
);
router.get(
  '/platform/activity',
  requireAuth,
  validate(platformActivitySchema),
  platformActivityHandler,
);
router.get(
  '/platform/reports',
  requireAuth,
  validate(platformSummarySchema),
  platformReportsHandler,
);
router.get(
  '/platform/system',
  requireAuth,
  platformSystemHandler,
);
router.get(
  '/platform/billing',
  requireAuth,
  platformBillingHandler,
);
router.patch(
  '/platform/billing/:tenantId',
  requireAuth,
  validate(updateBillingSchema),
  platformBillingUpdateHandler,
);
router.post(
  '/platform/billing/:tenantId/warn',
  requireAuth,
  validate(billingTenantParamsSchema),
  platformBillingWarnHandler,
);
router.post(
  '/platform/billing/:tenantId/invoice',
  requireAuth,
  validate(billingTenantParamsSchema),
  platformBillingInvoiceHandler,
);
router.get(
  '/tenants/:tenantId',
  requireAuth,
  validate(studioSummarySchema),
  studioHandler,
);
router.post(
  '/platform/exports/seal',
  requireAuth,
  validate(exportSealSchema),
  platformExportSealHandler,
);
router.post(
  '/platform/exports/verify',
  requireAuth,
  validate(exportVerifySchema),
  platformExportVerifyHandler,
);

export default router;
