import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { createMemoryUploader } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
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

const imageUpload = createMemoryUploader({ fileSize: 5 * 1024 * 1024 });
const imageUploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: 'Too many image uploads. Try again later.',
  keyByUser: true,
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
