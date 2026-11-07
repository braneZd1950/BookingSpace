import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { HttpError } from '../../utils/httpError.js';
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

const videoUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator(req) {
    return String(req.user?._id || req.user?.id || req.ip);
  },
  handler(req, res, next) {
    next(new HttpError(429, 'Too many video uploads. Try again later.', {
      code: 'TOO_MANY_REQUESTS',
    }));
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
