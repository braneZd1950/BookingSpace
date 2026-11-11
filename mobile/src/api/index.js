/**
 * Mobile API sloj → postojeći Express backend (`server/`).
 * Isti REST ugovor kao web (`client/src/api` + docs/07-api-spec.md).
 *
 * Primjer:
 *   import { login, getMe, getHealth } from '../api';
 *   await login({ email, password });
 *   const me = await getMe();
 */

export { getApiBaseUrl } from './config.js';
export {
  TOKEN_KEY,
  getToken,
  setToken,
  clearToken,
  setTokenStorage,
} from './token.js';
export { ApiError, apiRequest, http } from './http.js';

export { getHealth } from './health.js';

export {
  login,
  googleAuth,
  register,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
} from './auth.js';

export {
  getMyTenants,
  getPublicTenant,
  discoverTenants,
  createTenant,
  updateTenant,
  updateTenantSite,
} from './tenants.js';

export {
  listServices,
  createService,
  updateService,
  getAvailability,
} from './services.js';

export { getStudioAnalytics } from './analytics.js';

export {
  listTenantBookings,
  listMyBookings,
  createBooking,
  cancelBooking,
  completeBooking,
  markNoShow,
} from './bookings.js';

export {
  listMemberships,
  listMyMemberships,
  createMembership,
  suspendMembership,
  listPlans,
  createPlan,
  updatePlan,
} from './memberships.js';

export {
  listStaff,
  createStaff,
  suspendStaff,
} from './staff.js';

export { recordConsent } from './consent.js';

export {
  getPushConfig,
  listPushSubscriptions,
  subscribePush,
  unsubscribePush,
} from './push.js';

export {
  listCustomers,
  getCustomer,
} from './customers.js';

export {
  listPayments,
  createPayment,
} from './payments.js';
