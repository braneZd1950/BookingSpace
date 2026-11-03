import { apiRequest } from './client';

export type Membership = {
  id: string;
  userId: string;
  status: string;
  tenantId?: string;
  tenant?: { id?: string; name?: string; slug?: string };
  sessionsIncluded?: number | null;
  sessionsUsed?: number;
  sessionsRemaining?: number | null;
  membershipPlanId?: string;
  planName?: string;
  code?: string;
  validFrom?: string;
  validUntil?: string;
  user?: { name?: string; email?: string; phone?: string };
};

export type MembershipPlan = {
  id: string;
  name: string;
  sessionsIncluded?: number;
  active?: boolean;
};

export async function listMemberships(tenantId: string): Promise<Membership[]> {
  const data = await apiRequest<{ memberships: Membership[] }>(
    `/tenants/${tenantId}/memberships`,
  );
  return data.memberships || [];
}

/** Same as web `listMyMemberships` — `/memberships/my`. */
export async function listMyMemberships(limit = 50): Promise<Membership[]> {
  const data = await apiRequest<{ memberships: Membership[] }>(
    `/memberships/my?limit=${limit}`,
  );
  return data.memberships || [];
}

export async function listPlans(tenantId: string): Promise<MembershipPlan[]> {
  const data = await apiRequest<{ plans: MembershipPlan[] }>(
    `/tenants/${tenantId}/membership-plans`,
  );
  return data.plans || [];
}

export async function createPlan(
  tenantId: string,
  body: Record<string, unknown>,
): Promise<MembershipPlan> {
  const data = await apiRequest<{ plan: MembershipPlan }>(
    `/tenants/${tenantId}/membership-plans`,
    { method: 'POST', body },
  );
  return data.plan;
}

export type CreateMembershipResult = {
  membership?: Membership;
  accountCreated?: boolean;
  inviteSent?: boolean;
};

export async function createMembership(
  tenantId: string,
  body: Record<string, unknown>,
): Promise<CreateMembershipResult> {
  return apiRequest<CreateMembershipResult>(`/tenants/${tenantId}/memberships`, {
    method: 'POST',
    body,
  });
}

export async function suspendMembership(id: string): Promise<void> {
  await apiRequest(`/memberships/${id}/suspend`, { method: 'PATCH' });
}
