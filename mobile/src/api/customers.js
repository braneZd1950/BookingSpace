import { http } from './http.js';

/** GET /tenants/:tenantId/customers */
export function listCustomers(tenantId) {
  return http.get(`/tenants/${tenantId}/customers`);
}

/** GET /tenants/:tenantId/customers/:userId */
export function getCustomer(tenantId, userId) {
  return http.get(`/tenants/${tenantId}/customers/${userId}`);
}
