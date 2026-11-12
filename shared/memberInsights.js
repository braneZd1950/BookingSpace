import { daysLeft } from './dateRange.js';

export function formatMonthHr(yearMonth) {
  const [year, month] = String(yearMonth).split('-').map(Number);
  if (!year || !month) return yearMonth;
  const label = new Intl.DateTimeFormat('hr-HR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export function seriesByMonth(series) {
  const map = new Map();
  for (const row of series || []) {
    const key = String(row.date || '').slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(key)) continue;
    const current = map.get(key) || {
      month: key,
      page_view: 0,
      booking_created: 0,
      booking_cancelled: 0,
      member_created: 0,
    };
    current.page_view += Number(row.page_view) || 0;
    current.booking_created += Number(row.booking_created) || 0;
    current.booking_cancelled += Number(row.booking_cancelled) || 0;
    current.member_created += Number(row.member_created) || 0;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function memberName(item) {
  return item?.user?.name || item?.user?.email || 'Član';
}

export function buildMemberInsights(memberships, bookings) {
  const active = (memberships || []).filter((item) => item.status === 'ACTIVE');
  const visitsByUser = new Map();
  for (const booking of bookings || []) {
    if (booking.status !== 'CONFIRMED' && booking.status !== 'COMPLETED') continue;
    const id = String(booking.userId || '');
    if (!id) continue;
    visitsByUser.set(id, (visitsByUser.get(id) || 0) + 1);
  }

  const endingSoon = [];
  const packageHot = [];
  const noVisit = [];
  let withVisit = 0;

  for (const item of active) {
    const userId = String(item.userId || '');
    const left = daysLeft(item.validUntil);
    const visits = visitsByUser.get(userId) || 0;
    if (visits > 0) withVisit += 1;
    else noVisit.push(item);

    if (left != null && left >= 0 && left <= 7) {
      endingSoon.push({ item, left, visits });
    }

    const included = item.sessionsIncluded;
    if (included != null) {
      const used = Number(item.sessionsUsed) || 0;
      const total = Number(included) || 0;
      if (total > 0 && used / total >= 0.85) {
        packageHot.push({
          item,
          used,
          total,
          ratio: used / total,
          visits,
        });
      }
    }
  }

  endingSoon.sort((a, b) => a.left - b.left);
  packageHot.sort((a, b) => b.ratio - a.ratio);
  noVisit.sort((a, b) => memberName(a).localeCompare(memberName(b), 'hr'));

  return {
    activeCount: active.length,
    endingSoonCount: endingSoon.length,
    packageHotCount: packageHot.length,
    noVisitCount: noVisit.length,
    regularity: active.length > 0 ? Math.round((withVisit / active.length) * 100) : 0,
    endingSoon: endingSoon.slice(0, 6),
    packageHot: packageHot.slice(0, 6),
    noVisit: noVisit.slice(0, 6),
  };
}
