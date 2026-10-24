import { Router } from 'express';
import multer from 'multer';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import { catalog, create, list, remove, update, upload } from './controller.js';
import {
  createOnlineSchema,
  onlineItemParamsSchema,
  tenantOnlineParamsSchema,
  updateOnlineSchema,
} from './schema.js';

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024, files: 1 },
});

const onlineRoutes = Router({ mergeParams: true });

onlineRoutes.get(
  '/catalog',
  optionalAuth,
  validate(tenantOnlineParamsSchema),
  catalog,
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
