/** Public Otkrij categories — single source for web, mobile and API. */

/** [id, shortLabel, name, note] */
const CATEGORY_ROWS = [
  ['playroom', 'Igraonice', 'Igraonice i rođendani', 'Igraonice, termini rođendana, paketi i prostori.'],
  ['wellness', 'Wellness', 'Wellness i spa', 'Saune, spa, masaže i wellness paketi.'],
  ['beauty', 'Beauty', 'Beauty i njega', 'Saloni, tretmani i individualne usluge.'],
  ['sport', 'Sport', 'Sport i aktivnosti', 'Aktivnosti koje žele biti javno pronađene.'],
  ['health', 'Zdravlje', 'Zdravlje', 'Terapije i usluge s terminima.'],
  ['workshop', 'Radionice', 'Radionice i edukacije', 'Radionice, tečajevi i edukativni termini.'],
  ['generic', 'Ostalo', 'Ostale usluge', 'Ostala poslovanja s javnom vidljivošću.'],
];

export const discoverCategories = CATEGORY_ROWS.map(([id, label, name, note]) => ({
  id,
  label,
  name,
  note,
}));

export const discoverCategoryTabs = [
  { id: 'all', label: 'Sve' },
  ...discoverCategories.map(({ id, label }) => ({ id, label })),
];

/**
 * Niche / legacy ids → public Otkrij category.
 * Used by API discoverTenants and client/mobile normalize.
 */
export const DISCOVER_CATEGORY_NICHES = Object.freeze({
  playroom: ['playroom'],
  beauty: ['services', 'beauty'],
  wellness: ['wellness', 'spa'],
  sport: ['sport', 'activities'],
  health: ['health', 'physio'],
  workshop: ['workshop', 'education', 'radionica'],
  generic: ['generic'],
});

export const MEMBERSHIP_FIRST_NICHES = Object.freeze([
  'fitness',
  'pilates',
  'yoga',
  'powerplate',
]);

const MEMBERSHIP_FIRST = new Set(MEMBERSHIP_FIRST_NICHES);

const NICHE_TO_CATEGORY = (() => {
  const map = new Map();
  for (const [categoryId, niches] of Object.entries(DISCOVER_CATEGORY_NICHES)) {
    for (const niche of niches) map.set(niche, categoryId);
  }
  for (const niche of MEMBERSHIP_FIRST_NICHES) map.set(niche, 'sport');
  return map;
})();

/** Map API niche / categoryId into public Otkrij categories. */
export function toPublicDiscoverCategory(categoryId) {
  const key = String(categoryId || 'generic');
  if (MEMBERSHIP_FIRST.has(key)) return 'sport';
  return NICHE_TO_CATEGORY.get(key) || 'generic';
}

/** Alias for server discoverTenants (same rules as toPublicDiscoverCategory). */
export function categoryForNiche(niche) {
  return toPublicDiscoverCategory(niche);
}

export function categoryLabel(categoryId) {
  return discoverCategories.find((item) => item.id === categoryId)?.name || 'Ostale usluge';
}

export function placesForCategory(categoryId, places = []) {
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

export function countsFromPlaces(places, categories = discoverCategories) {
  const counts = { all: places.length };
  for (const category of categories) counts[category.id] = 0;
  for (const place of places) {
    const key = place.categoryId || 'generic';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/** Resolve filter tab id (legacy fitness/services → public buckets). */
export function resolveDiscoverCategoryFilter(category = 'all') {
  if (!category || category === 'all') return 'all';
  return toPublicDiscoverCategory(category);
}
