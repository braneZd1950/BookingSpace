export function daysLeft(until) {
  if (!until) return null;
  const end = new Date(`${until}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86400000);
}

export function monthRange(from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const pad = (value) => String(value).padStart(2, '0');
  const last = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

export function dateKeyToLocalDate(date) {
  const [y, m, d] = String(date || '').split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Remaining calendar days in the current month (including today). */
export function daysLeftInMonth(from = new Date()) {
  const last = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();
  return Math.max(1, last - from.getDate() + 1);
}
