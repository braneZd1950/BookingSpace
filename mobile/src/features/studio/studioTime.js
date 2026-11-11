import {
  withinCancellationWindow as sharedWithinCancellationWindow,
  zonedNow,
} from '../../../../shared/time.js';

const weekdayShort = new Intl.DateTimeFormat('hr-HR', { weekday: 'short' });
const weekdayLong = new Intl.DateTimeFormat('hr-HR', { weekday: 'long' });
const dayMonth = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'numeric' });

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function upcomingDays(count, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function formatDay(date) {
  const name = weekdayLong.format(date);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}, ${dayMonth.format(date)}`;
}

/** Croatian plural for “rezervacija”. */
export function reservationCountLabel(count) {
  const n = Number(count) || 0;
  if (n === 0) return 'Nema rezervacija';
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod10 === 1 && mod100 !== 11) return `${n} rezervacija`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} rezervacije`;
  }
  return `${n} rezervacija`;
}

export function formatDayChip(date) {
  const name = weekdayShort.format(date).replace(/\.$/, '');
  return {
    weekday: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    day: String(date.getDate()),
  };
}

export function dateFromKey(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const monthTitle = new Intl.DateTimeFormat('hr-HR', { month: 'long', year: 'numeric' });

export function monthLabel(date) {
  const label = monthTitle.format(date);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

/** Monday-first calendar cells (null = padding). */
export function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function formatCancellationWindow(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value < 0) return 'nije definirano';
  if (value === 0) return 'do samog početka termina';
  if (value < 60) return `${value} min prije početka`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  const hoursLabel = hours === 1
    ? '1 sat'
    : hours >= 2 && hours <= 4
      ? `${hours} sata`
      : `${hours} sati`;
  if (rest === 0) return `${hoursLabel} prije početka`;
  return `${hoursLabel} i ${rest} min prije početka`;
}

export const fallbackHours = {
  week: { works: true, from: '07:00', to: '21:00' },
  saturday: { works: true, from: '09:00', to: '13:00' },
  sunday: { works: false, from: '09:00', to: '13:00' },
  holidays: { works: false, from: '09:00', to: '13:00' },
};

export const hourRows = [
  ['week', 'Ponedjeljak–petak'],
  ['saturday', 'Subota'],
  ['sunday', 'Nedjelja'],
  ['holidays', 'Blagdani'],
];

function dayRow(workingHours, day) {
  const row = (workingHours || []).find((item) => Number(item.day) === day);
  if (!row || row.closed || !row.open || !row.close) {
    return { works: false, from: '09:00', to: '13:00' };
  }
  return { works: true, from: row.open, to: row.close };
}

/** Map API workingHours into the studio UI hours shape. */
export function hoursFromWorking(workingHours) {
  if (!workingHours?.length) return { ...fallbackHours };
  return {
    ...fallbackHours,
    week: dayRow(workingHours, 1),
    saturday: dayRow(workingHours, 6),
    sunday: dayRow(workingHours, 0),
  };
}

/** Convert studio UI hours into API bookingSettings.workingHours. */
export function hoursPayload(hours) {
  const source = { ...fallbackHours, ...hours };
  const row = (day, value) => (
    value.works
      ? { day, closed: false, open: value.from, close: value.to }
      : { day, closed: true }
  );
  return [
    row(1, source.week),
    row(2, source.week),
    row(3, source.week),
    row(4, source.week),
    row(5, source.week),
    row(6, source.saturday),
    row(0, source.sunday),
  ];
}

export function isValidClock(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ''));
}

export function dayOpen(workingHours, date) {
  const day = date.getDay();
  const row = (workingHours || []).find((item) => Number(item.day) === day);
  if (!row) return false;
  return !row.closed && Boolean(row.open) && Boolean(row.close);
}

export function zonedClock(timeZone = 'Europe/Zagreb') {
  return zonedNow(timeZone);
}

export function withinCancellationWindow(now, date, startTime, windowMinutes) {
  const minutes = Number(windowMinutes);
  if (!Number.isFinite(minutes) || minutes < 0) return false;
  return sharedWithinCancellationWindow(now, date, startTime, minutes);
}
