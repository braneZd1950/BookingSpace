import { http } from './http.js';

/** GET /tenants/:tenantId/bookings */
export function listTenantBookings(tenantId, { date, dateFrom, dateTo, limit = 200 } = {}) {
  return http.get(`/tenants/${tenantId}/bookings`, {
    params: {
      ...(date ? { date } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
      limit,
    },
  });
}

/** GET /bookings/my */
export function listMyBookings(limit = 50) {
  return http.get('/bookings/my', { params: { limit } });
}

/** POST /bookings */
export function createBooking(body) {
  return http.post('/bookings', body);
}

/** PATCH /bookings/:bookingId/cancel */
export function cancelBooking(bookingId) {
  return http.patch(`/bookings/${bookingId}/cancel`, {});
}

/** PATCH /bookings/:bookingId/complete */
export function completeBooking(bookingId) {
  return http.patch(`/bookings/${bookingId}/complete`, {});
}

/** PATCH /bookings/:bookingId/no-show */
export function markNoShow(bookingId) {
  return http.patch(`/bookings/${bookingId}/no-show`, {});
}
