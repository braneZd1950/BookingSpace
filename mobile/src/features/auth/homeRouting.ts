import type { AuthUser } from '../../api/auth';

export type MembershipHint = {
  status?: string;
  tenant?: { slug?: string };
};

export type TenantHint = {
  role?: string;
  tenant?: { slug?: string };
};

/** Transient failure — callers should retry / stay, not redirect to login. */
export const HOME_UNAVAILABLE = '__HOME_UNAVAILABLE__';

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

/**
 * Apply fetch outcome after memberships/tenants load (pure; safe for Node tests).
 */
export function resolveHomeHrefAfterFetch(
  user: AuthUser | null | undefined,
  ctx: {
    memberships?: MembershipHint[];
    tenants?: TenantHint[];
    networkFail?: boolean;
  } = {},
): string {
  if (!user) return '/(auth)/login';
  if (isOwnerRole(user)) return '/(app)';

  const memberships = ctx.memberships || [];
  const tenants = ctx.tenants || [];
  if (ctx.networkFail && memberships.length === 0 && tenants.length === 0) {
    return HOME_UNAVAILABLE;
  }
  return resolveHomeHrefFromContext(user, { memberships, tenants });
}
