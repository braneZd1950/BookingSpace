import { listMyMemberships } from '../api/memberships.js';
import { getMyTenants } from '../api/tenants.js';

/**
 * Isti redoslijed kao web LoginPage.openMemberStudio / resolvePostLoginPath:
 * aktivna članarina s slugom, inače TenantUser s ulogom CUSTOMER.
 *
 * @returns {Promise<{
 *   slug: string,
 *   tenantId?: string,
 *   tenantName?: string,
 *   membership?: object|null,
 * }|null>}
 */
export async function resolveMemberStudio() {
  try {
    const mine = await listMyMemberships(50);
    const memberships = Array.isArray(mine?.memberships) ? mine.memberships : [];
    const active = memberships.find(
      (item) => item?.status === 'ACTIVE' && item?.tenant?.slug,
    );
    if (active?.tenant?.slug) {
      return {
        slug: String(active.tenant.slug),
        tenantId: active.tenant.id || active.tenantId,
        tenantName: active.tenant.name || undefined,
        membership: active,
      };
    }
  } catch {
    /* fallback na tenants/mine */
  }

  try {
    const data = await getMyTenants();
    const tenants = Array.isArray(data?.tenants) ? data.tenants : [];
    const customer =
      tenants.find((row) => row?.role === 'CUSTOMER' && row?.tenant?.slug)
      || tenants.find((row) => row?.tenant?.slug);
    if (customer?.tenant?.slug) {
      return {
        slug: String(customer.tenant.slug),
        tenantId: customer.tenant.id || customer.tenant._id,
        tenantName: customer.tenant.name || undefined,
        membership: null,
      };
    }
  } catch {
    /* nema studija */
  }

  return null;
}
