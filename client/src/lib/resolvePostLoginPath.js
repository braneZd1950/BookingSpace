/**
 * Pure post-login destination helper — mirrors mobile resolveHomeHref
 * and LoginPage openGuide / openMemberStudio outcomes.
 */
export function isOwnerRole(user) {
  if (!user) return false;
  return user.role === 'BUSINESS_OWNER'
    || user.platformAdmin === true
    || user.role === 'ADMIN'
    || user.role === 'PLATFORM_STAFF';
}

/**
 * @param {object|null|undefined} user
 * @param {{
 *   memberships?: Array<{ status?: string, tenant?: { slug?: string } }>,
 *   tenants?: Array<{ role?: string, tenant?: { slug?: string } }>,
 *   guideDone?: boolean,
 * }} [ctx]
 */
export function resolvePostLoginPath(user, ctx = {}) {
  if (!user) return '/login';

  if (user.platformAdmin || user.role === 'ADMIN' || user.role === 'PLATFORM_STAFF') {
    return '/admin';
  }

  if (user.role === 'BUSINESS_OWNER') {
    return ctx.guideDone === false ? '/postavljanje' : '/stranica';
  }

  const memberships = ctx.memberships || [];
  const active = memberships.find(
    (item) => item.status === 'ACTIVE' && item.tenant?.slug,
  );
  if (active?.tenant?.slug) return `/s/${active.tenant.slug}`;

  const tenants = ctx.tenants || [];
  const customer = tenants.find((row) => row.role === 'CUSTOMER') || tenants[0];
  if (customer?.tenant?.slug) return `/s/${customer.tenant.slug}`;

  return '/login';
}
