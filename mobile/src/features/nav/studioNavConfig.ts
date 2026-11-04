/**
 * Owner studio nav destinations (pilot set).
 * Keep in sync with `client/src/lib/studioNavConfig.js`.
 */

export type StudioNavKey =
  | 'home'
  | 'slots'
  | 'calendar'
  | 'members'
  | 'analytics'
  | 'settings';

export type StudioNavLinkDef = {
  key: StudioNavKey;
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export const STUDIO_NAV_PILOT_LABELS = [
  'Početna',
  'Termini',
  'Kalendar',
  'Članovi',
  'Analitika',
  'Postavke',
] as const;

export const STUDIO_NAV_LINKS: StudioNavLinkDef[] = [
  {
    key: 'home',
    href: '/(app)',
    label: 'Početna',
    match: (p) =>
      (p === '/' || p === '' || /\/\(app\)\/?$/.test(p) || /\/index$/.test(p))
      && !/(termini|studio|kalendar|clanovi|member|analitika|postavke)/.test(p),
  },
  {
    key: 'slots',
    href: '/(app)/termini',
    label: 'Termini',
    match: (p) => /termini|studio/.test(p),
  },
  {
    key: 'calendar',
    href: '/(app)/kalendar',
    label: 'Kalendar',
    match: (p) => /kalendar/.test(p),
  },
  {
    key: 'members',
    href: '/(app)/clanovi',
    label: 'Članovi',
    match: (p) => /clanovi|member/.test(p),
  },
  {
    key: 'analytics',
    href: '/(app)/analitika',
    label: 'Analitika',
    match: (p) => /analitika/.test(p),
  },
  {
    key: 'settings',
    href: '/(app)/postavke',
    label: 'Postavke',
    match: (p) => /postavke/.test(p),
  },
];

export function activeStudioNavKey(pathname: string): StudioNavKey | null {
  const hit = STUDIO_NAV_LINKS.find((link) => link.match(pathname));
  return hit?.key ?? null;
}
