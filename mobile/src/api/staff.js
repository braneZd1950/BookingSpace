import { http } from './http.js';

/** GET /tenants/:tenantId/staff */
export function listStaff(tenantId) {
  return http.get(`/tenants/${tenantId}/staff`);
}

/** POST /tenants/:tenantId/staff */
export function createStaff(tenantId, body) {
  return http.post(`/tenants/${tenantId}/staff`, body);
}

/** PATCH /tenants/:tenantId/staff/:userId/suspend */
export function suspendStaff(tenantId, userId) {
  return http.patch(`/tenants/${tenantId}/staff/${userId}/suspend`, {});
}
