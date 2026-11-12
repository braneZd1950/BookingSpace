export {
  addDaysKey,
  dayOpen,
  fallbackHours,
  formatCancellationWindow,
  hourRows,
  hoursPayload,
  monthCells,
  monthLabel,
  sameDay,
  toDateKey,
  upcomingDays,
  withinCancellationWindow,
  zonedClock,
} from '../../../../shared/studioTime.js';

import { fallbackHours } from '../../../../shared/studioTime.js';

export function studioHours(studio) {
  return { ...fallbackHours, ...studio?.hours };
}

export function dayHours(date, hours) {
  const day = date.getDay();
  if (day === 0) return hours.sunday;
  if (day === 6) return hours.saturday;
  return hours.week;
}

const weekday = new Intl.DateTimeFormat('hr-HR', { weekday: 'long' });
const dayMonth = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'numeric' });

export function formatDay(date) {
  const name = weekday.format(date);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${dayMonth.format(date)}`;
}
