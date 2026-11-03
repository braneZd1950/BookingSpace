import { apiRequest } from './client';

export type Slot = {
  startTime: string;
  endTime?: string;
  status: string;
  available: number;
  capacity: number;
};

export type Booking = {
  id: string;
  userId: string;
  tenantId?: string;
  date?: string;
  startTime: string;
  endTime: string;
  status: string;
  serviceName?: string;
  serviceCapacity?: number;
  user?: { name?: string };
  staff?: { name?: string };
};

export async function getAvailability(
  tenantId: string,
  serviceId: string,
  date: string,
): Promise<Slot[]> {
  const data = await apiRequest<{ slots: Slot[] }>(
    `/tenants/${tenantId}/services/${serviceId}/availability?date=${encodeURIComponent(date)}`,
  );
  return data.slots || [];
}

export async function listTenantBookings(
  tenantId: string,
  opts: { date?: string; dateFrom?: string; dateTo?: string; limit?: number },
): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (opts.date) params.set('date', opts.date);
  if (opts.dateFrom) params.set('dateFrom', opts.dateFrom);
  if (opts.dateTo) params.set('dateTo', opts.dateTo);
  params.set('limit', String(opts.limit ?? 100));
  const data = await apiRequest<{ bookings: Booking[] }>(
    `/tenants/${tenantId}/bookings?${params.toString()}`,
  );
  return data.bookings || [];
}

export async function createBooking(body: {
  serviceId: string;
  date: string;
  startTime: string;
  userId?: string;
  staffId?: string;
}): Promise<void> {
  await apiRequest('/bookings', { method: 'POST', body });
}

export async function cancelBooking(bookingId: string): Promise<void> {
  await apiRequest(`/bookings/${bookingId}/cancel`, { method: 'PATCH' });
}

export async function listMyBookings(limit = 50): Promise<Booking[]> {
  const data = await apiRequest<{ bookings: Booking[] }>(
    `/bookings/my?limit=${limit}`,
  );
  return data.bookings || [];
}
