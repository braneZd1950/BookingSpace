import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { HttpError } from '../../utils/httpError.js';
import { requireTenantRole } from '../access.js';
import {
  create,
  discover,
  mine,
  publicProfile,
  removeGallery,
  update,
  updateWebsite,
  upload,
} from './controller.js';
import {
  createTenantSchema,
  discoverTenantsSchema,
  publicTenantSchema,
  removeGalleryImageSchema,
  updateSiteSchema,
  updateTenantSchema,
  uploadImageSchema,
} from './schema.js';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const imageUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator(req) {
    return String(req.user?._id || req.user?.id || req.ip);
  },
  handler(req, res, next) {
    next(new HttpError(429, 'Too many image uploads. Try again later.', {
      code: 'TOO_MANY_REQUESTS',
    }));
  },
});

const router = Router();

router.post('/', requireAuth, validate(createTenantSchema), create);
router.get('/mine', requireAuth, mine);
router.get('/discover', validate(discoverTenantsSchema), discover);
router.get('/:slug/public', validate(publicTenantSchema), publicProfile);
router.patch('/:tenantId', requireAuth, validate(updateTenantSchema), requireTenantRole('BUSINESS_OWNER'), update);
router.patch('/:tenantId/site', requireAuth, validate(updateSiteSchema), requireTenantRole('BUSINESS_OWNER'), updateWebsite);
router.post(
  '/:tenantId/images',
  requireAuth,
  requireTenantRole('BUSINESS_OWNER'),
  imageUploadLimiter,
  imageUpload.single('file'),
  validate(uploadImageSchema),
  upload,
);
router.delete(
  '/:tenantId/gallery',
  requireAuth,
  validate(removeGalleryImageSchema),
  requireTenantRole('BUSINESS_OWNER'),
  removeGallery,
);

export default router;
