import {
  cancelBooking,
  completeBooking,
  createBooking,
  listMyBookings,
  listTenantBookings,
  markNoShow,
} from './service.js';

export async function create(req, res) {
  const booking = await createBooking(req.user, req.input.body);
  res.status(201).json({ booking });
}

export async function mine(req, res) {
  const bookings = await listMyBookings(req.user, req.input.query.limit);
  res.json({ bookings });
}

export async function listForTenant(req, res) {
  const bookings = await listTenantBookings(req.user, req.input.params.tenantId, req.input.query);
  res.json({ bookings });
}

export async function cancel(req, res) {
  const booking = await cancelBooking(req.user, req.input.params.bookingId);
  res.json({ booking });
}

export async function complete(req, res) {
  const booking = await completeBooking(req.user, req.input.params.bookingId);
  res.json({ booking });
}

export async function noShow(req, res) {
  const booking = await markNoShow(req.user, req.input.params.bookingId);
  res.json({ booking });
}
