import { apiRequest } from './client';

export type StaffMember = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  role?: string;
  status: string;
};

export async function listStaff(tenantId: string): Promise<StaffMember[]> {
  const data = await apiRequest<{ staff: StaffMember[] }>(`/tenants/${tenantId}/staff`);
  return data.staff || [];
}

export type CreateStaffResult = {
  staff?: StaffMember;
  accountCreated?: boolean;
  inviteSent?: boolean;
};

export async function createStaff(
  tenantId: string,
  body: Record<string, unknown>,
): Promise<CreateStaffResult> {
  return apiRequest<CreateStaffResult>(`/tenants/${tenantId}/staff`, {
    method: 'POST',
    body,
  });
}

export async function suspendStaff(tenantId: string, userId: string): Promise<void> {
  await apiRequest(`/tenants/${tenantId}/staff/${userId}/suspend`, { method: 'PATCH' });
}
