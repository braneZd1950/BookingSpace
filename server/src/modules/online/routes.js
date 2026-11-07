import { Router } from 'express';
import multer from 'multer';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
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

/** Cap upload body early; service also asserts magic bytes + size (100 MiB). */
const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024;

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_UPLOAD_BYTES,
    files: 1,
    fields: 8,
    fieldSize: 64 * 1024,
  },
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
  videoUpload.single('file'),
  validate(tenantOnlineParamsSchema),
  requireTenantRole('BUSINESS_OWNER', 'STAFF'),
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
