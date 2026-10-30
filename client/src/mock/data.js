/** Usklađeno sa `npm --prefix server run seed:demo`. */
export const business = {
  id: 'tenant-demo-fitness',
  personType: 'pravna',
  name: 'Demo Fitness',
  slug: 'demo-fitness',
  niche: 'fitness',
  email: 'studio@demo-fitness.hr',
  phone: '+385 23 555 010',
  address: 'Ulica Ivana Meštrovića 1, Zadar',
  timezone: 'Europe/Zagreb',
  owner: {
    id: 'user-ana-kovac',
    name: 'Ana Kovač',
    email: 'ana.kovac@demo.hr',
    password: 'lozinka1234',
    role: 'BUSINESS_OWNER',
  },
};

export const member = {
  id: 'user-ivan-horvat',
  personType: 'fizička',
  name: 'Ivan Horvat',
  email: 'ivan.horvat@demo.hr',
  password: 'lozinka1234',
  phone: '+385 91 222 0002',
  role: 'CUSTOMER',
  membership: {
    id: 'membership-ivan-demo',
    tenantId: business.id,
    planName: '12 treninga',
    status: 'ACTIVE',
    sessionsIncluded: 12,
    sessionsUsed: 1,
  },
};
