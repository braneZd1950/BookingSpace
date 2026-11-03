import { apiRequest } from './client';

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  capacity: number;
  cancellationWindowMinutes?: number;
  active?: boolean;
};

export async function listServices(tenantId: string): Promise<Service[]> {
  const data = await apiRequest<{ services: Service[] }>(`/tenants/${tenantId}/services`);
  return data.services || [];
}

export async function createService(
  tenantId: string,
  body: Record<string, unknown>,
): Promise<Service> {
  const data = await apiRequest<{ service: Service }>(`/tenants/${tenantId}/services`, {
    method: 'POST',
    body,
  });
  return data.service;
}

export async function updateService(
  serviceId: string,
  body: Record<string, unknown>,
): Promise<Service> {
  const data = await apiRequest<{ service: Service }>(`/services/${serviceId}`, {
    method: 'PATCH',
    body,
  });
  return data.service;
}
