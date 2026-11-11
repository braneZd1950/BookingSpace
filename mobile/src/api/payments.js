import { http } from './http.js';

/** GET /tenants/:tenantId/payments */
export function listPayments(tenantId) {
  return http.get(`/tenants/${tenantId}/payments`);
}

/** POST /tenants/:tenantId/payments */
export function createPayment(tenantId, body) {
  return http.post(`/tenants/${tenantId}/payments`, body);
}
