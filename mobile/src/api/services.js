import { http } from './http.js';

/** GET /tenants/:tenantId/services */
export function listServices(tenantId) {
  return http.get(`/tenants/${tenantId}/services`);
}

/** POST /tenants/:tenantId/services */
export function createService(tenantId, body) {
  return http.post(`/tenants/${tenantId}/services`, body);
}

/** PATCH /services/:serviceId */
export function updateService(serviceId, body) {
  return http.patch(`/services/${serviceId}`, body);
}

/** GET /tenants/:tenantId/services/:serviceId/availability?date= */
export function getAvailability(tenantId, serviceId, date) {
  return http.get(
    `/tenants/${tenantId}/services/${serviceId}/availability`,
    { params: { date } },
  );
}
