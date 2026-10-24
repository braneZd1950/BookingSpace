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

export function upcomingDays(count, from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

const monthTitle = new Intl.DateTimeFormat('hr-HR', { month: 'long', year: 'numeric' });

export function monthLabel(date) {
  const label = monthTitle.format(date);
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: pad }, () => null);
  for (let day = 1; day <= total; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function sameDay(left, right) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMinutes(value) {
  const [hours, minutes] = String(value || '00:00').split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function addDaysKey(isoDate, days) {
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
  const read = (type) => parts.find((part) => part.type === type)?.value ?? '';
  const hour = read('hour') === '24' ? '00' : read('hour');
  return {
    date: `${read('year')}-${read('month')}-${read('day')}`,
    time: `${hour.padStart(2, '0')}:${read('minute').padStart(2, '0')}`,
  };
}

/** True if cancel still restores the session (matches server rule). */
export function withinCancellationWindow(now, date, startTime, windowMinutes) {
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
