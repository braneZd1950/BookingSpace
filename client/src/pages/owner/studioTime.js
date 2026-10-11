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
