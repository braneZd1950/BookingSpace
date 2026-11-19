/**
 * Development reference data for public Discover (/otkrij).
 * Live listings come only from GET /api/tenants/discover (opt-in visibility).
 * Mock rows are for local UI experiments — never merge into production results.
 */

import { DISCOVER_VISIBILITY } from '../lib/discoverVisibility.js';

export {
  discoverCategories,
  filterDiscoverPlaces,
  placesForCategory,
  toPublicDiscoverCategory,
} from '../lib/discoverCategories.js';

/** @deprecated Prefer live API only on /otkrij; kept for local layout experiments. */
export const DISCOVER_MOCK_ENABLED = false;

/** @typedef {{ id: string, categoryId: string, name: string, city: string, area?: string, note: string, tags?: string[], slug?: string, live?: boolean, discoverVisibility?: string }} DiscoverPlace */

/** Local-only examples — not shown on the public page by default. */
export const discoverPlaces = [
  {
    id: 'mock-playroom',
    categoryId: 'playroom',
    name: 'Primjer igraonice',
    city: 'Zagreb',
    area: 'Centar',
    note: 'Lokalni mock — nije u produkcijskom Otkrij.',
    tags: ['igraonica'],
    slug: 'mock-playroom',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC,
  },
  {
    id: 'mock-wellness',
    categoryId: 'wellness',
    name: 'Primjer wellness',
    city: 'Split',
    note: 'Lokalni mock — nije u produkcijskom Otkrij.',
    tags: ['spa'],
    slug: 'mock-wellness',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC_CONTACT,
  },
  {
    id: 'mock-beauty',
    categoryId: 'beauty',
    name: 'Primjer beauty',
    city: 'Rijeka',
    note: 'Lokalni mock — nije u produkcijskom Otkrij.',
    tags: ['salon'],
    slug: 'mock-beauty',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC,
  },
  {
    id: 'mock-sport',
    categoryId: 'sport',
    name: 'Primjer sport',
    city: 'Osijek',
    note: 'Lokalni mock — nije u produkcijskom Otkrij.',
    tags: ['sport'],
    slug: 'mock-sport',
    live: false,
    discoverVisibility: DISCOVER_VISIBILITY.PUBLIC,
  },
];
