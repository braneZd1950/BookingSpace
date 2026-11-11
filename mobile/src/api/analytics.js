import { http } from './http.js';

/** GET /analytics/tenants/:tenantId?days= */
export function getStudioAnalytics(tenantId, days = 30) {
  return http.get(`/analytics/tenants/${tenantId}`, {
    params: { days },
  });
}
