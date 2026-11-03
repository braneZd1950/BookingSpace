import { ApiError } from '../../api/client';
import type { AuthUser } from '../../api/auth';
import { listMyMemberships } from '../../api/memberships';
import { listMyTenants } from '../../api/tenants';
import { isOwnerRole, resolveHomeHrefFromContext } from './homeRouting';

export { isOwnerRole, resolveHomeHrefFromContext } from './homeRouting';

export type ResolveHomeDeps = {
  listMyMemberships?: typeof listMyMemberships;
  listMyTenants?: typeof listMyTenants;
};

/** Transient failure — callers should retry / stay, not redirect to login. */
export const HOME_UNAVAILABLE = '__HOME_UNAVAILABLE__';

/**
 * Mirror web LoginPage routing:
 * - BUSINESS_OWNER / platform → owner studio shell `/(app)`
 * - members → `/(member)/[slug]` via memberships/my (then tenants/mine)
 * - no membership → `/(auth)/login` (auth layout must not loop-redirect)
 * - network/5xx → HOME_UNAVAILABLE
 */
export async function resolveHomeHref(
  user: AuthUser | null | undefined,
  deps: ResolveHomeDeps = {},
): Promise<string> {
  if (!user) return '/(auth)/login';
  if (isOwnerRole(user)) return '/(app)';

  const fetchMemberships = deps.listMyMemberships || listMyMemberships;
  const fetchTenants = deps.listMyTenants || listMyTenants;

  let memberships: Awaited<ReturnType<typeof listMyMemberships>> = [];
  let tenants: Awaited<ReturnType<typeof listMyTenants>> = [];
  let networkFail = false;

  try {
    memberships = await fetchMemberships(50);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 0 || err.status >= 500)) {
      networkFail = true;
    } else {
      memberships = [];
    }
  }

  try {
    tenants = await fetchTenants();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 0 || err.status >= 500)) {
      networkFail = true;
    } else {
      tenants = [];
    }
  }

  if (networkFail && memberships.length === 0 && tenants.length === 0) {
    return HOME_UNAVAILABLE;
  }

  return resolveHomeHrefFromContext(user, { memberships, tenants });
}
