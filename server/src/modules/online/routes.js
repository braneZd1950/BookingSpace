import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';
import { createDiskUploader } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import { catalog, create, list, media, remove, update, upload } from './controller.js';
import {
  createOnlineSchema,
  onlineItemParamsSchema,
  onlineMediaSchema,
  tenantOnlineParamsSchema,
  updateOnlineSchema,
} from './schema.js';

/** Authenticated video only; disk-backed (not RAM). Service re-checks magic + size. */
const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

const videoUpload = createDiskUploader({
  fileSize: MAX_VIDEO_UPLOAD_BYTES,
  fields: 8,
  fieldSize: 64 * 1024,
});
const videoUploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: 'Too many video uploads. Try again later.',
  keyByUser: true,
});

const onlineRoutes = Router({ mergeParams: true });

onlineRoutes.get(
  '/catalog',
  optionalAuth,
  validate(tenantOnlineParamsSchema),
  catalog,
);

onlineRoutes.get(
  '/:workoutId/media',
  optionalAuth,
  validate(onlineMediaSchema),
  media,
);

onlineRoutes.get(
  '/',
  requireAuth,
  validate(tenantOnlineParamsSchema),
  requireTenantRole('BUSINESS_OWNER', 'STAFF'),
  list,
);

onlineRoutes.post(
  '/upload',
  requireAuth,
  validate(tenantOnlineParamsSchema),
  requireTenantRole('BUSINESS_OWNER', 'STAFF'),
  videoUploadLimiter,
  videoUpload.single('file'),
  upload,
);

onlineRoutes.post(
  '/',
  requireAuth,
  validate(createOnlineSchema),
  requireTenantRole('BUSINESS_OWNER', 'STAFF'),
  create,
);

onlineRoutes.patch(
  '/:workoutId',
  requireAuth,
  validate(updateOnlineSchema),
  requireTenantRole('BUSINESS_OWNER', 'STAFF'),
  update,
);

onlineRoutes.delete(
  '/:workoutId',
  requireAuth,
  validate(onlineItemParamsSchema),
  requireTenantRole('BUSINESS_OWNER', 'STAFF'),
  remove,
);

export default onlineRoutes;
