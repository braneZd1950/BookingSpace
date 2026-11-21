/** Shared member occupancy calendar copy + helpers (web + mobile). */

export const CALENDAR_WEEKDAY_SHORT = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

export const CALENDAR_LEVEL_ORDER = ['free', 'low', 'mid', 'high', 'max', 'closed'];

export const MEMBER_CALENDAR_COPY = {
  closedDay: 'Poslovanje je zatvoreno ovog dana.',
  emptyDay: 'Još nema rezervacija — dan izgleda slobodan.',
  noData: 'Nema podataka',
  closed: 'Zatvoreno',
  occupancyFallback: 'Zauzetost',
  full: 'Puno',
  free: 'Slobodno',
};

export function resolveOccupancyDayLevel(day) {
  if (day?.open === false) return 'closed';
  return day?.level || 'free';
}

export function isOccupancySlotFull(slot) {
  return slot?.status === 'FULL' || Number(slot?.remaining) <= 0;
}

export function occupancyDaySubtitle(day) {
  if (!day) return MEMBER_CALENDAR_COPY.noData;
  if (day.open === false) return MEMBER_CALENDAR_COPY.closed;
  return day.label || MEMBER_CALENDAR_COPY.occupancyFallback;
}

export function occupancySlotBadge(slot) {
  if (isOccupancySlotFull(slot)) return MEMBER_CALENDAR_COPY.full;
  const remaining = Number(slot?.remaining);
  if (Number.isFinite(remaining)) return `${remaining} slob.`;
  return MEMBER_CALENDAR_COPY.free;
}

export function occupancySlotStatusLabel(slot) {
  if (slot?.label) return slot.label;
  return isOccupancySlotFull(slot) ? MEMBER_CALENDAR_COPY.full : MEMBER_CALENDAR_COPY.free;
}
