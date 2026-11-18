/**
 * Development reference data for public Discover (/otkrij).
 * Live listings come only from GET /api/tenants/discover (opt-in visibility).
 * Mock rows are for local UI experiments — never merge into production results.
 */

import { DISCOVER_VISIBILITY } from '../lib/discoverVisibility.js';

/** @deprecated Prefer live API only on /otkrij; kept for local layout experiments. */
export const DISCOVER_MOCK_ENABLED = false;

/** Categories shown in public Otkrij (selective discovery). */
export const discoverCategories = [
  {
    id: 'playroom',
    name: 'Igraonice i rođendani',
    note: 'Igraonice, termini rođendana, paketi i prostori.',
  },
  {
    id: 'wellness',
    name: 'Wellness i spa',
    note: 'Saune, spa, masaže i wellness paketi.',
  },
  {
    id: 'beauty',
    name: 'Beauty i njega',
    note: 'Saloni, tretmani i individualne usluge.',
  },
  {
    id: 'sport',
    name: 'Sport i aktivnosti',
    note: 'Aktivnosti koje žele biti javno pronađene.',
  },
  {
    id: 'health',
    name: 'Zdravlje',
    note: 'Terapije i usluge s terminima.',
  },
  {
    id: 'workshop',
    name: 'Radionice i edukacije',
    note: 'Radionice, tečajevi i edukativni termini.',
  },
  {
    id: 'generic',
    name: 'Ostale usluge',
    note: 'Ostala poslovanja s javnom vidljivošću.',
  },
];

/** @typedef {{ id: string, categoryId: string, name: string, city: string, area?: string, note: string, tags?: string[], slug?: string, live?: boolean, discoverVisibility?: string }} DiscoverPlace */

/** Local-only examples — not shown on the public page by default. */
export const discoverPlaces = [
  {
    id: 'play-jump',
    categoryId: 'playroom',
    name: 'Jump House',
    city: 'Zagreb',
    area: 'Jarun',
    note: 'Rođendani i sati igre za djecu.',
    tags: ['igraonica', 'rođendan'],
    slug: 'jump-house',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC,
  },
  {
    id: 'well-olive',
    categoryId: 'wellness',
    name: 'Olive Masaža',
    city: 'Zadar',
    note: 'Masaže i wellness termini.',
    tags: ['masaža', 'wellness'],
    slug: 'olive-masaza',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC_CONTACT,
  },
  {
    id: 'beauty-lumen',
    categoryId: 'beauty',
    name: 'Lumen Beauty',
    city: 'Zagreb',
    note: 'Frizerski i beauty termini.',
    tags: ['beauty'],
    slug: 'lumen-beauty',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC,
  },
  {
    id: 'workshop-atelier',
    categoryId: 'workshop',
    name: 'Atelier Knjige',
    city: 'Zagreb',
    note: 'Radionice i večernje grupe.',
    tags: ['radionica'],
    slug: 'atelier-knjige',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC,
  },
];

/** Map API niche / legacy category ids into public Otkrij categories. */
export function toPublicDiscoverCategory(categoryId) {
  const key = String(categoryId || 'generic');
  if (key === 'playroom') return 'playroom';
  if (key === 'wellness' || key === 'spa') return 'wellness';
  if (key === 'beauty' || key === 'services') return 'beauty';
  if (key === 'sport' || key === 'activities') return 'sport';
  if (key === 'health' || key === 'physio') return 'health';
  if (key === 'workshop' || key === 'education' || key === 'radionica') return 'workshop';
  if (key === 'fitness' || key === 'pilates' || key === 'yoga' || key === 'powerplate') {
    // Only appear when API already opted them into discover → sport bucket.
    return 'sport';
  }
  if (key === 'generic') return 'generic';
  return 'generic';
}

export function placesForCategory(categoryId, places = discoverPlaces) {
  return places.filter((item) => item.categoryId === categoryId);
}

export function filterDiscoverPlaces(places, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return places;
  return places.filter((item) => {
    const hay = [
      item.name,
      item.city,
      item.area,
      item.note,
      item.slug,
      ...(item.tags || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(needle);
  });
}
