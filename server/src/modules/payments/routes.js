import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import { create, list } from './controller.js';
import { createPaymentSchema, listPaymentsSchema } from './schema.js';

const router = Router({ mergeParams: true });
const manage = requireTenantRole('BUSINESS_OWNER', 'STAFF');

router.get('/', requireAuth, validate(listPaymentsSchema), manage, list);
router.post('/', requireAuth, validate(createPaymentSchema), manage, create);

export default router;
