/**
 * Owner studio nav destinations (pilot set).
 */

export const STUDIO_NAV_ALL = [
  { key: 'home', to: '/stranica', label: 'Početna', end: true },
  { key: 'slots', to: '/stranica/termini', label: 'Termini' },
  { key: 'gallery', to: '/stranica/galerija', label: 'Galerija', flag: 'gallery' },
  { key: 'online', to: '/stranica/online', label: 'Online', flag: 'online' },
  { key: 'payments', to: '/stranica/placanja', label: 'Blagajna', flag: 'payments' },
  { key: 'calendar', to: '/stranica/kalendar', label: 'Kalendar' },
  { key: 'members', to: '/stranica/clanovi', label: 'Članovi' },
  { key: 'analytics', to: '/stranica/analitika', label: 'Analitika' },
  { key: 'plan', to: '/stranica/plan', label: 'Plan', flag: 'plan' },
  { key: 'settings', to: '/stranica/postavke', label: 'Postavke' },
];

/** Pilot labels always visible when feature flags are off. */
export const STUDIO_NAV_PILOT_KEYS = [
  'home',
  'slots',
  'calendar',
  'members',
  'analytics',
  'settings',
];

export function filterStudioNavLinks(allLinks, featureOn = {}) {
  return allLinks.filter((item) => !item.flag || featureOn[item.flag]);
}

export function studioNavPilotLabels(allLinks = STUDIO_NAV_ALL, featureOn = {}) {
  return filterStudioNavLinks(allLinks, featureOn).map((item) => item.label);
}

export function isStudioHomePath(pathname) {
  const path = String(pathname || '').replace(/\/$/, '') || '/stranica';
  return path === '/stranica';
}

export function matchStudioNavPath(pathname, to, { end = false } = {}) {
  const path = String(pathname || '').replace(/\/$/, '') || '/stranica';
  const target = String(to || '').replace(/\/$/, '') || '/stranica';
  if (end) return path === target;
  return path === target || path.startsWith(`${target}/`);
}
