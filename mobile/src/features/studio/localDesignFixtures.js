/**
 * Samo lokalni/dev dizajn — nikad u produkciji.
 * `__DEV__` je true u Expo/Metro development buildu.
 */

function pad(value) {
  return String(value).padStart(2, '0');
}

function monthBounds(from = new Date()) {
  const year = from.getFullYear();
  const month = from.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  return {
    from: `${year}-${pad(month + 1)}-01`,
    until: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

/** @returns {boolean} */
export function isLocalDesignMode() {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

export function isFixtureId(id) {
  return Boolean(id && String(id).startsWith('local-design-'));
}

/**
 * Dva demo člana za prilagodbu UI-a dok je lista prazna.
 * @returns {Array<object>}
 */
export function localDesignMembers() {
  if (!isLocalDesignMode()) return [];
  const { from, until } = monthBounds();
  return [
    {
      id: 'local-design-member-1',
      userId: 'local-design-user-1',
      membershipPlanId: 'local-design-plan-12',
      code: 'DEMO-ANA',
      status: 'ACTIVE',
      planName: '12 treninga',
      validFrom: from,
      validUntil: until,
      sessionsIncluded: 12,
      sessionsUsed: 4,
      user: {
        name: 'Ana Kovač',
        email: 'ana.demo@example.com',
        phone: '+385 91 111 2233',
      },
    },
    {
      id: 'local-design-member-2',
      userId: 'local-design-user-2',
      membershipPlanId: 'local-design-plan-8',
      code: 'DEMO-MARKO',
      status: 'ACTIVE',
      planName: '8 treninga',
      validFrom: from,
      validUntil: until,
      sessionsIncluded: 8,
      sessionsUsed: 7,
      user: {
        name: 'Marko Horvat',
        email: 'marko.demo@example.com',
        phone: '+385 98 444 5566',
      },
    },
  ];
}

/**
 * Dva demo člana tima (vlasnik + trener) za prilagodbu UI-a.
 * @returns {Array<object>}
 */
export function localDesignStaff() {
  if (!isLocalDesignMode()) return [];
  return [
    {
      id: 'local-design-staff-owner',
      name: 'Iva Vlasnik',
      email: 'iva.demo@example.com',
      phone: '+385 91 000 1111',
      title: 'Vlasnik',
      role: 'BUSINESS_OWNER',
      status: 'ACTIVE',
    },
    {
      id: 'local-design-staff-coach',
      name: 'Luka Trener',
      email: 'luka.demo@example.com',
      phone: '+385 92 222 3333',
      title: 'Trener',
      role: 'STAFF',
      status: 'ACTIVE',
    },
  ];
}

/**
 * Dvije demo usluge za lokalnu prilagodbu UI-a.
 * @returns {Array<object>}
 */
export function localDesignServices() {
  if (!isLocalDesignMode()) return [];
  return [
    {
      id: 'local-design-service-1',
      name: 'Grupni trening',
      description: 'Mali grupni sat u studiju.',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 12,
      cancellationWindowMinutes: 60,
      price: 0,
      membershipRequired: true,
      active: true,
    },
    {
      id: 'local-design-service-2',
      name: 'Personalni trening',
      description: 'Jedan na jedan s trenerom.',
      durationMinutes: 45,
      slotIntervalMinutes: 45,
      capacity: 1,
      cancellationWindowMinutes: 120,
      price: 0,
      membershipRequired: true,
      active: true,
    },
  ];
}

/**
 * Demo analitika (30 dana) za lokalni dizajn.
 * @returns {{ days: number, counts: Record<string, number>, series: Array<Record<string, unknown>> }}
 */
export function localDesignAnalytics() {
  if (!isLocalDesignMode()) {
    return {
      days: 30,
      counts: {},
      series: [],
      bookingsByStatus: {},
      bookingsTotal: 0,
      bookingsSeries: [],
      comparison: {},
      period: null,
    };
  }
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const toKey = (date) => (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  );
  const bookingsSeries = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const total = i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : i % 5 === 0 ? 1 : 0;
    bookingsSeries.push({
      date: toKey(d),
      total,
      CONFIRMED: total > 0 ? 1 : 0,
      COMPLETED: Math.max(0, total - 1),
      CANCELLED: 0,
      NO_SHOW: 0,
    });
  }
  const dateFrom = bookingsSeries[0].date;
  const dateTo = bookingsSeries[bookingsSeries.length - 1].date;
  return {
    days: 30,
    counts: {
      page_view: 128,
      login_success: 34,
      member_created: 2,
      booking_created: 41,
      booking_cancelled: 5,
      booking_completed: 29,
      booking_no_show: 3,
    },
    series: bookingsSeries.map((row) => ({
      date: row.date,
      page_view: row.total * 3,
      booking_created: row.total,
      booking_cancelled: 0,
      booking_completed: row.COMPLETED,
      member_created: 0,
    })),
    bookingsByStatus: {
      CONFIRMED: 4,
      COMPLETED: 29,
      CANCELLED: 5,
      NO_SHOW: 3,
    },
    bookingsTotal: 41,
    bookingsSeries,
    comparison: {
      page_view: { current: 128, previous: 110, deltaPct: 16 },
      member_created: { current: 2, previous: 1, deltaPct: 100 },
      bookingsTotal: { current: 41, previous: 36, deltaPct: 14 },
      COMPLETED: { current: 29, previous: 24, deltaPct: 21 },
      CANCELLED: { current: 5, previous: 7, deltaPct: -29 },
      NO_SHOW: { current: 3, previous: 2, deltaPct: 50 },
    },
    period: {
      days: 30,
      dateFrom,
      dateTo,
      previousFrom: dateFrom,
      previousTo: dateTo,
    },
  };
}
