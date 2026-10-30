import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createHandler,
  listHandler,
  removeHandler,
  updateHandler,
} from './controller.js';
import {
  createPlatformStaffSchema,
  platformStaffParamsSchema,
  updatePlatformStaffSchema,
} from './schema.js';

const router = Router();

router.get('/', requireAuth, listHandler);
router.post('/', requireAuth, validate(createPlatformStaffSchema), createHandler);
router.patch('/:staffId', requireAuth, validate(updatePlatformStaffSchema), updateHandler);
router.delete('/:staffId', requireAuth, validate(platformStaffParamsSchema), removeHandler);

export default router;
