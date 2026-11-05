/**
 * Member shell nav destinations.
 * Keep in sync with `client/src/lib/memberNavConfig.js`.
 */

export type MemberNavKey = 'home' | 'slots' | 'discover' | 'privacy' | 'settings';

export type MemberNavLinkDef = {
  key: MemberNavKey;
  href: string;
  label: string;
  match: (path: string) => boolean;
};

export const MEMBER_NAV_LABELS = [
  'Početna',
  'Termini',
  'Otkrij',
  'Privatnost',
  'Postavke',
] as const;

export function memberBaseHref(slug: string): string {
  return `/(member)/${String(slug || '').replace(/^\/+|\/+$/g, '')}`;
}

export function buildMemberNavLinks(slug: string): MemberNavLinkDef[] {
  const base = memberBaseHref(slug);
  return [
    {
      key: 'home',
      href: base,
      label: 'Početna',
      match: (p) =>
        (p === base || p === `${base}/` || p.endsWith(`/${slug}`))
        && !/(termini|otkrij|privatnost|postavke)/.test(p),
    },
    {
      key: 'slots',
      href: `${base}/termini`,
      label: 'Termini',
      match: (p) => /termini/.test(p),
    },
    {
      key: 'discover',
      href: `${base}/otkrij`,
      label: 'Otkrij',
      match: (p) => /otkrij/.test(p),
    },
    {
      key: 'privacy',
      href: `${base}/privatnost`,
      label: 'Privatnost',
      match: (p) => /privatnost/.test(p),
    },
    {
      key: 'settings',
      href: `${base}/postavke`,
      label: 'Postavke',
      match: (p) => /postavke/.test(p),
    },
  ];
}

export function activeMemberNavKey(pathname: string, slug: string): MemberNavKey | null {
  const hit = buildMemberNavLinks(slug).find((link) => link.match(pathname));
  return hit?.key ?? null;
}
