import type { AuthUser } from '../../api/auth';

export type MembershipHint = {
  status?: string;
  tenant?: { slug?: string };
};

export type TenantHint = {
  role?: string;
  tenant?: { slug?: string };
};

export function isOwnerRole(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'BUSINESS_OWNER'
    || user.platformAdmin === true
    || user.role === 'ADMIN'
    || user.role === 'PLATFORM_STAFF';
}

/**
 * Pure post-login destination (no network). Used by resolveHomeHref + unit tests.
 */
export function resolveHomeHrefFromContext(
  user: AuthUser | null | undefined,
  ctx: {
    memberships?: MembershipHint[];
    tenants?: TenantHint[];
  } = {},
): string {
  if (!user) return '/(auth)/login';
  if (isOwnerRole(user)) return '/(app)';

  const active = (ctx.memberships || []).find(
    (item) => item.status === 'ACTIVE' && item.tenant?.slug,
  );
  if (active?.tenant?.slug) return `/(member)/${active.tenant.slug}`;

  const customer = (ctx.tenants || []).find((row) => row.role === 'CUSTOMER')
    || (ctx.tenants || [])[0];
  if (customer?.tenant?.slug) return `/(member)/${customer.tenant.slug}`;

  // No studio membership — send to login rather than empty member shell (loop risk).
  return '/(auth)/login';
}
