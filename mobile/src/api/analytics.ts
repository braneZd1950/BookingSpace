import { apiRequest } from './client';

export type StudioAnalytics = {
  days: number;
  counts: Record<string, number>;
  series: Array<Record<string, number | string>>;
};

export async function getStudioAnalytics(
  tenantId: string,
  days = 30,
): Promise<StudioAnalytics> {
  return apiRequest<StudioAnalytics>(
    `/analytics/tenants/${tenantId}?days=${days}`,
  );
}
