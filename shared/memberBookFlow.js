import { toDateKey } from './studioTime.js';

/** Ordered booking wizard steps. Unused steps are skipped per studio/service. */
export const BOOKING_STEP_IDS = [
  'service',
  'info',
  'staff',
  'date',
  'slot',
  'review',
  'done',
];

export const BOOKING_STEP_LABELS = {
  service: 'Usluga',
  info: 'Detalji',
  staff: 'Osoblje',
  date: 'Datum',
  slot: 'Termin',
  review: 'Pregled',
  done: 'Potvrda',
};

/**
 * Build the active step list for this studio + selected service.
 * - One service → still keep service/info (preselected) so rules are visible
 * - No trainers → skip staff
 * - One trainer → skip staff (auto-selected in UI)
 */
export function resolveBookingSteps({ trainers = [] } = {}) {
  const steps = ['service', 'info'];
  if ((trainers || []).length > 1) steps.push('staff');
  steps.push('date', 'slot', 'review', 'done');
  return steps;
}

export function nextStep(steps, current) {
  const index = steps.indexOf(current);
  if (index < 0 || index >= steps.length - 1) return current;
  return steps[index + 1];
}

export function prevStep(steps, current) {
  const index = steps.indexOf(current);
  if (index <= 0) return current;
  return steps[index - 1];
}

export function formatServicePrice(price) {
  if (price == null || price === '') return '';
  const value = Number(price);
  if (!Number.isFinite(value)) return String(price);
  try {
    return new Intl.NumberFormat('hr-HR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${value} €`;
  }
}

export function bookingStatusLabel(status) {
  if (status === 'CONFIRMED') return 'Potvrđeno';
  if (status === 'COMPLETED') return 'Završeno';
  if (status === 'CANCELLED') return 'Otkazano';
  if (status === 'NO_SHOW') return 'Nedolazak';
  return status || '';
}

/**
 * Classify cancelled booking as timely vs late using cancelledAt vs appointment start − window.
 * Returns 'timely' | 'late' | null when not cancelled / unknown.
 */
export function cancelTiming(booking, windowMinutes) {
  if (booking?.status !== 'CANCELLED' || !booking?.cancelledAt) return null;
  const window = Number(windowMinutes);
  if (!Number.isFinite(window) || window < 0) return null;
  const [y, m, d] = String(booking.date || '').split('-').map(Number);
  const [hh, mm] = String(booking.startTime || '00:00').split(':').map(Number);
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  const deadline = new Date(start.getTime() - window * 60 * 1000);
  const cancelledAt = new Date(booking.cancelledAt);
  if (Number.isNaN(cancelledAt.getTime())) return null;
  return cancelledAt.getTime() <= deadline.getTime() ? 'timely' : 'late';
}

export function bookingStatusDisplay(booking, services = []) {
  if (booking?.status === 'CANCELLED') {
    const service = (services || []).find(
      (item) => String(item.id) === String(booking.serviceId),
    );
    const timing = cancelTiming(
      booking,
      service?.cancellationWindowMinutes ?? 60,
    );
    if (timing === 'timely') return 'Pravovremeno otkazano';
    if (timing === 'late') return 'Zakašnjelo otkazano';
    return 'Otkazano';
  }
  return bookingStatusLabel(booking?.status);
}

export function filterMemberBookings(bookings, {
  tenantId,
  filter = 'upcoming',
  todayKey = toDateKey(new Date()),
} = {}) {
  const list = (bookings || []).filter(
    (item) => String(item.tenantId) === String(tenantId),
  );

  const sorted = [...list].sort((a, b) => {
    const byDate = String(a.date).localeCompare(String(b.date));
    if (byDate !== 0) return filter === 'past' || filter === 'cancelled' ? -byDate : byDate;
    const byTime = String(a.startTime).localeCompare(String(b.startTime));
    return filter === 'past' || filter === 'cancelled' ? -byTime : byTime;
  });

  if (filter === 'cancelled') {
    return sorted.filter((item) => item.status === 'CANCELLED' || item.status === 'NO_SHOW');
  }
  if (filter === 'past') {
    return sorted.filter((item) => (
      item.status === 'COMPLETED'
      || (item.status === 'CONFIRMED' && String(item.date) < todayKey)
    ));
  }
  // upcoming: confirmed on/after today
  return sorted.filter((item) => (
    item.status === 'CONFIRMED' && String(item.date) >= todayKey
  ));
}

export function serviceNeedsMembership(service) {
  return Boolean(service?.membershipRequired);
}
