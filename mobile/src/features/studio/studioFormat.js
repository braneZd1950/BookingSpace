/** Shared formatting helpers for studio screens. */

export function formatShortDate(value) {
  if (!value) return '—';
  const [y, m, d] = String(value).split('-').map(Number);
  if (!y || !m || !d) return String(value);
  return new Intl.DateTimeFormat('hr-HR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(y, m - 1, d));
}

/**
 * Croatian count label.
 * @param {number} count
 * @param {{ zero: string, one: (n: number) => string, few: (n: number) => string, many: (n: number) => string }} forms
 */
export function hrCountLabel(count, forms) {
  const n = Number(count) || 0;
  if (n === 0) return forms.zero;
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod10 === 1 && mod100 !== 11) return forms.one(n);
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms.few(n);
  return forms.many(n);
}

export function serviceCountLabel(count) {
  return hrCountLabel(count, {
    zero: 'Nema usluga',
    one: (n) => `${n} usluga`,
    few: (n) => `${n} usluge`,
    many: (n) => `${n} usluga`,
  });
}

export function memberCountLabel(count) {
  return hrCountLabel(count, {
    zero: 'Nema članova',
    one: (n) => `${n} član`,
    few: (n) => `${n} člana`,
    many: (n) => `${n} članova`,
  });
}
