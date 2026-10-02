import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import { detail, list } from './controller.js';
import { customerParamsSchema, listCustomersSchema } from './schema.js';

const router = Router({ mergeParams: true });
const manage = requireTenantRole('BUSINESS_OWNER', 'STAFF');

router.get('/', requireAuth, validate(listCustomersSchema), manage, list);
router.get('/:userId', requireAuth, validate(customerParamsSchema), manage, detail);

export default router;
