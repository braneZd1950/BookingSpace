export {
  dateFromKey,
  dayOpen,
  fallbackHours,
  formatCancellationWindow,
  hourRows,
  hoursPayload,
  isValidClock,
  monthCells,
  monthLabel,
  sameDay,
  toDateKey,
  upcomingDays,
  withinCancellationWindow,
  zonedClock,
} from '../../../../shared/studioTime.js';

import { fallbackHours } from '../../../../shared/studioTime.js';

const weekdayShort = new Intl.DateTimeFormat('hr-HR', { weekday: 'short' });
const weekdayLong = new Intl.DateTimeFormat('hr-HR', { weekday: 'long' });
const dayMonth = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'numeric' });

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
