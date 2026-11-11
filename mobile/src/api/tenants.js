import { http } from './http.js';

/** GET /tenants/mine */
export function getMyTenants() {
  return http.get('/tenants/mine');
}

/** GET /tenants/:slug/public */
export function getPublicTenant(slug) {
  return http.get(`/tenants/${encodeURIComponent(slug)}/public`, { auth: false });
}

/** GET /tenants/discover */
export function discoverTenants({ q = '', category = 'all', limit = 60 } = {}) {
  return http.get('/tenants/discover', {
    auth: false,
    params: {
      ...(q ? { q } : {}),
      ...(category && category !== 'all' ? { category } : {}),
      limit,
    },
  });
}

/** POST /tenants */
export function createTenant(body) {
  return http.post('/tenants', body);
}

/** PATCH /tenants/:tenantId */
export function updateTenant(tenantId, body) {
  return http.patch(`/tenants/${tenantId}`, body);
}

/** PATCH /tenants/:tenantId/site */
export function updateTenantSite(tenantId, body) {
  return http.patch(`/tenants/${tenantId}/site`, body);
}
