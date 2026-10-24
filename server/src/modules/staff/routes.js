import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import { create, list, suspend } from './controller.js';
import {
  createStaffSchema,
  staffMemberParamsSchema,
  tenantStaffParamsSchema,
} from './schema.js';

const staffRoutes = Router({ mergeParams: true });

staffRoutes.get(
  '/',
  requireAuth,
  validate(tenantStaffParamsSchema),
  requireTenantRole('BUSINESS_OWNER', 'STAFF'),
  list,
);

staffRoutes.post(
  '/',
  requireAuth,
  validate(createStaffSchema),
  requireTenantRole('BUSINESS_OWNER'),
  create,
);

staffRoutes.patch(
  '/:userId/suspend',
  requireAuth,
  validate(staffMemberParamsSchema),
  requireTenantRole('BUSINESS_OWNER'),
  suspend,
);

export default staffRoutes;
