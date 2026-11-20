/**
 * Mock rezervacije samo za lokalni Vite + localhost / 127.0.0.1.
 * Ne ulazi u produkcijski build ponašanje (IS_DEV) i ne piše u bazu.
 */
import { IS_DEV } from './runtimeEnv.js';

const PREFIX = 'local-book-';

export function isLocalBookingMock() {
  if (!IS_DEV) return false;
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

export function isLocalBookingFixtureId(id) {
  return Boolean(id && String(id).startsWith(PREFIX));
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function addMinutes(startTime, minutes) {
  const [hh, mm] = String(startTime || '09:00').split(':').map(Number);
  const total = (hh || 0) * 60 + (mm || 0) + Number(minutes || 60);
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
}

function dateOffset(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Radni sati: pon–pet 08–20, sub 09–14, ned zatvoreno. */
export function localBookingWorkingHours() {
  if (!isLocalBookingMock()) return [];
  return [
    { day: 0, closed: true, open: '', close: '' },
    { day: 1, closed: false, open: '08:00', close: '20:00' },
    { day: 2, closed: false, open: '08:00', close: '20:00' },
    { day: 3, closed: false, open: '08:00', close: '20:00' },
    { day: 4, closed: false, open: '08:00', close: '20:00' },
    { day: 5, closed: false, open: '08:00', close: '20:00' },
    { day: 6, closed: false, open: '09:00', close: '14:00' },
  ];
}

export function localBookingServices() {
  if (!isLocalBookingMock()) return [];
  return [
    {
      id: `${PREFIX}service-group`,
      name: 'Grupni trening (mock)',
      description: 'Lokalni mock — nije u bazi.',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 12,
      cancellationWindowMinutes: 60,
      price: 12,
      membershipRequired: true,
      active: true,
    },
    {
      id: `${PREFIX}service-pt`,
      name: 'Personalni trening (mock)',
      description: 'Lokalni mock — nije u bazi.',
      durationMinutes: 45,
      slotIntervalMinutes: 45,
      capacity: 1,
      cancellationWindowMinutes: 120,
      price: 35,
      membershipRequired: false,
      active: true,
    },
  ];
}

export function localBookingTrainers() {
  if (!isLocalBookingMock()) return [];
  return [
    {
      id: `${PREFIX}staff-ana`,
      name: 'Ana Trener',
      title: 'Trener',
    },
    {
      id: `${PREFIX}staff-luka`,
      name: 'Luka Trener',
      title: 'Trener',
    },
  ];
}

/**
 * Slobodni termini za odabrani dan (mock).
 * @param {string} _date
 * @param {{ durationMinutes?: number, capacity?: number } | null} service
 */
export function localBookingSlots(_date, service = null) {
  if (!isLocalBookingMock()) return [];
  const duration = Number(service?.durationMinutes) || 60;
  const capacity = Number(service?.capacity) || 8;
  const starts = ['09:00', '10:00', '11:00', '17:00', '18:00', '19:00'];
  return starts.map((startTime, index) => {
    const booked = index === 2 ? capacity : index === 4 ? Math.max(1, capacity - 2) : 0;
    const remaining = Math.max(0, capacity - booked);
    let status = 'AVAILABLE';
    if (remaining <= 0) status = 'FULL';
    return {
      startTime,
      endTime: addMinutes(startTime, duration),
      status,
      capacity,
      booked,
      remaining,
    };
  });
}

/**
 * Primjeri „Moje rezervacije” za filtere.
 * @param {string|number} tenantId
 */
export function localBookingList(tenantId) {
  if (!isLocalBookingMock()) return [];
  const tid = String(tenantId || 'local');
  return [
    {
      id: `${PREFIX}booking-upcoming`,
      tenantId: tid,
      serviceId: `${PREFIX}service-group`,
      serviceName: 'Grupni trening (mock)',
      date: dateOffset(2),
      startTime: '18:00',
      endTime: '19:00',
      status: 'CONFIRMED',
      staff: { name: 'Ana Trener' },
    },
    {
      id: `${PREFIX}booking-past`,
      tenantId: tid,
      serviceId: `${PREFIX}service-group`,
      date: dateOffset(-5),
      startTime: '10:00',
      endTime: '11:00',
      status: 'COMPLETED',
      serviceName: 'Grupni trening (mock)',
    },
    {
      id: `${PREFIX}booking-cancelled`,
      tenantId: tid,
      serviceId: `${PREFIX}service-pt`,
      date: dateOffset(-2),
      startTime: '09:00',
      endTime: '09:45',
      status: 'CANCELLED',
      cancelledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      serviceName: 'Personalni trening (mock)',
    },
  ];
}
