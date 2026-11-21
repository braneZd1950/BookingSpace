/** Shared member occupancy calendar copy + helpers (web + mobile). */

import { loadLabel } from './calendarOccupancy.js';

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
  filterAll: 'Sve usluge',
  selectedDay: 'Odabrani dan',
  loadError: 'Kalendar se nije učitao.',
  loadErrorRetry: 'Kalendar se nije učitao. Pokušajte ponovo.',
  bookCta: 'Rezerviraj termin',
  bookDayCta: 'Rezerviraj ovaj dan',
  gridHint: 'Dodirnite dan za termine. Broj je ukupan broj rezervacija tog dana.',
};

/** Cell fill colors used by the mobile occupancy grid. */
export const OCCUPANCY_CELL_COLORS = {
  free: 'rgba(148, 163, 184, 0.14)',
  low: 'rgba(45, 212, 191, 0.28)',
  mid: 'rgba(96, 165, 250, 0.4)',
  high: 'rgba(251, 191, 36, 0.45)',
  max: 'rgba(251, 113, 133, 0.5)',
  closed: 'rgba(15, 23, 42, 0.55)',
};

/** Legend swatch colors (slightly stronger free tint than cells). */
export const OCCUPANCY_LEGEND_COLORS = {
  free: 'rgba(148, 163, 184, 0.18)',
  low: 'rgba(45, 212, 191, 0.28)',
  mid: 'rgba(96, 165, 250, 0.4)',
  high: 'rgba(251, 191, 36, 0.45)',
  max: 'rgba(251, 113, 133, 0.5)',
  closed: 'rgba(15, 23, 42, 0.55)',
};

export function occupancyLegendItems() {
  return CALENDAR_LEVEL_ORDER.map((id) => ({
    id,
    label: loadLabel(id),
    color: OCCUPANCY_LEGEND_COLORS[id],
  }));
}

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

export function formatOccupancySlotTime(slot) {
  if (!slot?.startTime) return '';
  return slot.endTime ? `${slot.startTime} – ${slot.endTime}` : slot.startTime;
}

export function formatOccupancySlotMeta(slot) {
  const booked = slot?.booked ?? 0;
  const capacity = slot?.capacity ?? '—';
  return `${booked}/${capacity} · ${occupancySlotStatusLabel(slot)}`;
}

export function listActiveTenantServices(tenantServices, fallbackServices = []) {
  const fromTenant = (tenantServices || [])
    .filter((item) => item.active !== false)
    .map((item) => ({ id: String(item.id), name: item.name }));
  if (fromTenant.length) return fromTenant;
  return (fallbackServices || []).map((item) => ({
    id: String(item.id),
    name: item.name,
  }));
}
