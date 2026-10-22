import { Router } from 'express';
import analyticsRoutes from './analytics/routes.js';
import authRoutes from './auth/routes.js';
import { bookingRoutes, tenantBookingRoutes } from './bookings/routes.js';
import consentRoutes from './consent/routes.js';
import customerRoutes from './customers/routes.js';
import {
  membershipCollectionRoutes,
  membershipItemRoutes,
  planCollectionRoutes,
  planItemRoutes,
} from './memberships/routes.js';
import paymentRoutes from './payments/routes.js';
import pushRoutes from './push/routes.js';
import { serviceCollectionRoutes, serviceItemRoutes } from './services/routes.js';
import sessionRoutes from './sessions/routes.js';
import tenantRoutes from './tenants/routes.js';

const api = Router();

api.use('/analytics', analyticsRoutes);
api.use('/auth', authRoutes);
api.use('/consent', consentRoutes);
api.use('/push', pushRoutes);
api.use('/tenants/:tenantId/services/:serviceId/availability', sessionRoutes);
api.use('/tenants/:tenantId/services', serviceCollectionRoutes);
api.use('/tenants/:tenantId/bookings', tenantBookingRoutes);
api.use('/tenants/:tenantId/membership-plans', planCollectionRoutes);
api.use('/tenants/:tenantId/memberships', membershipCollectionRoutes);
api.use('/tenants/:tenantId/payments', paymentRoutes);
api.use('/tenants/:tenantId/customers', customerRoutes);
api.use('/tenants', tenantRoutes);
api.use('/services', serviceItemRoutes);
api.use('/bookings', bookingRoutes);
api.use('/membership-plans', planItemRoutes);
api.use('/memberships', membershipItemRoutes);

export default api;
