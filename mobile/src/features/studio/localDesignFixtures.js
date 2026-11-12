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
 * @returns {{ days: number, counts: Record<string, number>, series: Array<object> }}
 */
export function localDesignAnalytics() {
  if (!isLocalDesignMode()) {
    return { days: 30, counts: {}, series: [] };
  }
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const pad = (value) => String(value).padStart(2, '0');
  const thisMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const lastMonth = `${prev.getFullYear()}-${pad(prev.getMonth() + 1)}`;
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
    series: [
      {
        date: `${lastMonth}-15`,
        page_view: 48,
        booking_created: 14,
        booking_cancelled: 2,
        member_created: 1,
      },
      {
        date: `${thisMonth}-08`,
        page_view: 80,
        booking_created: 27,
        booking_cancelled: 3,
        member_created: 1,
      },
    ],
  };
}
