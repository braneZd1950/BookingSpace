import type { StudioHours, DayHours } from '../features/studio/studioMap';

export const hourRows: Array<[keyof StudioHours, string]> = [
  ['week', 'Ponedjeljak–petak'],
  ['saturday', 'Subota'],
  ['sunday', 'Nedjelja'],
  ['holidays', 'Blagdani'],
];

export const fallbackHours: StudioHours = {
  week: { works: true, from: '07:00', to: '21:00' },
  saturday: { works: true, from: '09:00', to: '13:00' },
  sunday: { works: false, from: '09:00', to: '13:00' },
  holidays: { works: false, from: '09:00', to: '13:00' },
};

export function studioHours(hours?: Partial<StudioHours> | null): StudioHours {
  return { ...fallbackHours, ...(hours || {}) };
}

export function dayHours(date: Date, hours: StudioHours): DayHours {
  const day = date.getDay();
  if (day === 0) return hours.sunday;
  if (day === 6) return hours.saturday;
  return hours.week;
}

const weekday = new Intl.DateTimeFormat('hr-HR', { weekday: 'long' });
const dayMonth = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'numeric' });

export function formatDay(date: Date): string {
  const name = weekday.format(date);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${dayMonth.format(date)}`;
}

export function upcomingDays(count: number, from = new Date()): Date[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMinutes(value: string) {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function addDaysKey(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Local clock in studio timezone (same shape as server zonedNow). */
export function zonedClock(timeZone = 'Europe/Zagreb') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const hour = read('hour') === '24' ? '00' : read('hour');
  return {
    date: `${read('year')}-${read('month')}-${read('day')}`,
    time: `${hour.padStart(2, '0')}:${read('minute').padStart(2, '0')}`,
  };
}

/** True if cancel still restores the session (matches server rule). */
export function withinCancellationWindow(
  now: { date: string; time: string },
  date: string,
  startTime: string,
  windowMinutes: number,
) {
  const minutes = Number(windowMinutes);
  if (!Number.isFinite(minutes) || minutes < 0) return false;
  let deadline = toMinutes(startTime) - minutes;
  let deadlineDate = date;
  while (deadline < 0) {
    deadline += 24 * 60;
    deadlineDate = addDaysKey(deadlineDate, -1);
  }
  if (now.date < deadlineDate) return true;
  if (now.date > deadlineDate) return false;
  return toMinutes(now.time) <= deadline;
}

const shortWeekday = new Intl.DateTimeFormat('hr-HR', { weekday: 'short' });
const bookingDayFmt = new Intl.DateTimeFormat('hr-HR', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
});

export function shortDay(date: Date): string {
  const name = shortWeekday.format(date).replace('.', '');
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export function formatBookingDay(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const label = bookingDayFmt.format(new Date(y, m - 1, d));
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const monthTitle = new Intl.DateTimeFormat('hr-HR', { month: 'long', year: 'numeric' });

export function monthLabel(date: Date): string {
  const label = monthTitle.format(date);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function monthCells(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const padDays = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: padDays }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function sameDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function formatCancellationWindow(minutes: number): string {
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

export function timeOptions(stepMinutes = 30): string[] {
  const out: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    out.push(`${h}:${m}`);
  }
  return out;
}

/** 30 min … 12 h, korak 30 min. */
export const CANCEL_WINDOW_OPTIONS = Array.from(
  { length: ((12 * 60 - 30) / 30) + 1 },
  (_, index) => 30 + index * 30,
);

export function hoursPayload(hours: StudioHours) {
  const source = studioHours(hours);
  const row = (day: number, value: DayHours) => (
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
