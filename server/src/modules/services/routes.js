import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import { create, list, remove, update } from './controller.js';
import {
  createServiceSchema,
  listServicesSchema,
  serviceParamsSchema,
  updateServiceSchema,
} from './schema.js';

const collection = Router({ mergeParams: true });
collection.get('/', requireAuth, validate(listServicesSchema), requireTenantRole('BUSINESS_OWNER', 'STAFF'), list);
collection.post('/', requireAuth, validate(createServiceSchema), requireTenantRole('BUSINESS_OWNER', 'STAFF'), create);

const item = Router();
item.patch('/:serviceId', requireAuth, validate(updateServiceSchema), update);
item.delete('/:serviceId', requireAuth, validate(serviceParamsSchema), remove);

export { collection as serviceCollectionRoutes, item as serviceItemRoutes };
