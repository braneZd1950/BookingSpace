export {
  addDaysKey,
  copyWeekdayHours,
  dayKeyFromDate,
  dayOpen,
  fallbackHours,
  formatCancellationWindow,
  hourRows,
  hoursPayload,
  monthCells,
  monthLabel,
  normalizeHours,
  sameDay,
  toDateKey,
  upcomingDays,
  weekDates,
  weekStart,
  WEEKDAY_KEYS,
  withinCancellationWindow,
  zonedClock,
} from '../../../../shared/studioTime.js';

import { dayKeyFromDate, fallbackHours, normalizeHours } from '../../../../shared/studioTime.js';

export function studioHours(studio) {
  return normalizeHours(studio?.hours);
}

export function dayHours(date, hours) {
  const normalized = normalizeHours(hours);
  const key = dayKeyFromDate(date);
  return normalized[key] || fallbackHours[key] || fallbackHours.monday;
}

const weekday = new Intl.DateTimeFormat('hr-HR', { weekday: 'long' });
const dayMonth = new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'numeric' });

export function formatDay(date) {
  const name = weekday.format(date);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${dayMonth.format(date)}`;
}
