import { http } from './http.js';

/** GET /tenants/:tenantId/memberships */
export function listMemberships(tenantId) {
  return http.get(`/tenants/${tenantId}/memberships`);
}

/** GET /memberships/my */
export function listMyMemberships(limit = 50) {
  return http.get('/memberships/my', { params: { limit } });
}

/** POST /tenants/:tenantId/memberships */
export function createMembership(tenantId, body) {
  return http.post(`/tenants/${tenantId}/memberships`, body);
}

/** PATCH /memberships/:id/suspend */
export function suspendMembership(id) {
  return http.patch(`/memberships/${id}/suspend`, {});
}

/** GET /tenants/:tenantId/membership-plans */
export function listPlans(tenantId) {
  return http.get(`/tenants/${tenantId}/membership-plans`);
}

/** POST /tenants/:tenantId/membership-plans */
export function createPlan(tenantId, body) {
  return http.post(`/tenants/${tenantId}/membership-plans`, body);
}

/** PATCH /membership-plans/:id */
export function updatePlan(id, body) {
  return http.patch(`/membership-plans/${id}`, body);
}
