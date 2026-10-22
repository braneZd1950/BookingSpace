export const business = {
  id: 'tenant-demo',
  personType: 'pravna',
  name: 'anyminutes',
  slug: 'anyminutes',
  niche: 'fitness',
  email: 'studio@anyminutes.example',
  phone: '+385 23 000 000',
  address: 'Ulica Ivana Meštrovića 1, Zadar',
  timezone: 'Europe/Zagreb',
  owner: {
    id: 'user-ana-kovac',
    name: 'Ana Kovač',
    email: 'ana.kovac@anyminutes.example',
    password: 'lozinka1234',
    role: 'BUSINESS_OWNER',
  },
};

export const member = {
  id: 'user-ivan-horvat',
  personType: 'fizička',
  name: 'Ivan Horvat',
  email: 'ivan.horvat@example.com',
  password: 'lozinka1234',
  phone: '+385 91 000 0001',
  role: 'CUSTOMER',
  membership: {
    id: 'membership-ivan-demo',
    tenantId: business.id,
    code: 'MEM-2026-001',
    planName: '12 treninga',
    status: 'ACTIVE',
    validFrom: '2026-10-01',
    validUntil: '2026-10-31',
    sessionsIncluded: 12,
    sessionsUsed: 1,
  },
};
