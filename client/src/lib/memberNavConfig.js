/**
 * Member shell nav destinations.
 * Keep in sync with `mobile/src/features/nav/memberNavConfig.ts`.
 */

export const MEMBER_NAV_CORE = [
  { key: 'home', label: 'Početna', segment: '' },
  { key: 'slots', label: 'Termini', segment: 'termini' },
  { key: 'discover', label: 'Otkrij', segment: 'otkrij', requiresAuth: true },
  { key: 'privacy', label: 'Privatnost', segment: 'privatnost' },
];

export const MEMBER_NAV_OPTIONAL = [
  { key: 'online', label: 'Online', segment: 'online', flag: 'online' },
];

export function memberBasePath(slug) {
  return `/s/${String(slug || '').replace(/^\/+|\/+$/g, '')}`;
}

export function memberNavHref(slug, segment = '') {
  const base = memberBasePath(slug);
  const part = String(segment || '').replace(/^\/+|\/+$/g, '');
  return part ? `${base}/${part}` : base;
}

export function buildMemberNavLinks(slug, {
  loggedIn = false,
  onlineEnabled = false,
} = {}) {
  const items = [
    ...MEMBER_NAV_CORE,
    ...(onlineEnabled ? MEMBER_NAV_OPTIONAL : []),
  ];

  return items
    .filter((item) => !item.requiresAuth || loggedIn)
    .map((item) => ({
      key: item.key,
      label: item.label,
      to: memberNavHref(slug, item.segment),
      end: item.segment === '',
    }));
}

export function isMemberHomePath(pathname, slug) {
  const base = memberBasePath(slug);
  const path = String(pathname || '').replace(/\/$/, '') || base;
  return path === base;
}

export function matchMemberNavPath(pathname, to, { end = false } = {}) {
  const path = String(pathname || '').replace(/\/$/, '');
  const target = String(to || '').replace(/\/$/, '');
  if (!target) return false;
  if (end) return path === target;
  return path === target || path.startsWith(`${target}/`);
}
