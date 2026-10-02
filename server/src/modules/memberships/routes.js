import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { requireTenantRole } from '../access.js';
import {
  createMembershipHandler,
  createPlanHandler,
  listMembershipHandler,
  listPlanHandler,
  myMembershipHandler,
  suspendHandler,
  updatePlanHandler,
} from './controller.js';
import {
  createMembershipSchema,
  createPlanSchema,
  listMembershipsSchema,
  listPlansSchema,
  myMembershipsSchema,
  suspendMembershipSchema,
  updatePlanSchema,
} from './schema.js';

const manage = ['BUSINESS_OWNER', 'STAFF'];

const planCollection = Router({ mergeParams: true });
planCollection.get('/', requireAuth, validate(listPlansSchema), requireTenantRole(...manage), listPlanHandler);
planCollection.post('/', requireAuth, validate(createPlanSchema), requireTenantRole(...manage), createPlanHandler);

const planItem = Router();
planItem.patch('/:id', requireAuth, validate(updatePlanSchema), updatePlanHandler);

const membershipCollection = Router({ mergeParams: true });
membershipCollection.get('/', requireAuth, validate(listMembershipsSchema), requireTenantRole(...manage), listMembershipHandler);
membershipCollection.post('/', requireAuth, validate(createMembershipSchema), requireTenantRole(...manage), createMembershipHandler);

const membershipItem = Router();
membershipItem.get('/my', requireAuth, validate(myMembershipsSchema), myMembershipHandler);
membershipItem.patch('/:id/suspend', requireAuth, validate(suspendMembershipSchema), suspendHandler);

export {
  membershipCollection as membershipCollectionRoutes,
  membershipItem as membershipItemRoutes,
  planCollection as planCollectionRoutes,
  planItem as planItemRoutes,
};
