import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
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

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
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
  imageUpload.single('file'),
  validate(uploadImageSchema),
  requireTenantRole('BUSINESS_OWNER'),
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
