import { dayOpen, toDateKey } from './studioTime.js';

const bookingDay = new Intl.DateTimeFormat('hr-HR', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
});

export function sessionsLabel(membership) {
  if (!membership) return '';
  if (membership.sessionsIncluded == null) return 'Neograničeno';
  const left = membership.sessionsRemaining
    ?? Math.max(0, (membership.sessionsIncluded || 0) - (membership.sessionsUsed || 0));
  return `${left} preostalo`;
}

export function slotNote(slot) {
  if (slot.status === 'FULL') return 'Puno';
  if (slot.status === 'PAST') return 'Prošlo';
  if (slot.available === slot.capacity) return 'Slobodno';
  if (slot.available === 1) return '1 mjesto';
  return `${slot.available} mjesta`;
}

export function formatBookingDay(dateKey) {
  const [y, m, d] = String(dateKey || '').split('-').map(Number);
  const label = bookingDay.format(new Date(y, m - 1, d));
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function firstOpenKey(days, workingHours) {
  const open = (days || []).find((item) => dayOpen(workingHours, item));
  return toDateKey(open || days?.[0] || new Date());
}
