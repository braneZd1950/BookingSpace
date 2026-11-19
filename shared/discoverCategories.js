/** Public Otkrij categories — single source for web + mobile. */

export const discoverCategories = [
  {
    id: 'playroom',
    label: 'Igraonice',
    name: 'Igraonice i rođendani',
    note: 'Igraonice, termini rođendana, paketi i prostori.',
  },
  {
    id: 'wellness',
    label: 'Wellness',
    name: 'Wellness i spa',
    note: 'Saune, spa, masaže i wellness paketi.',
  },
  {
    id: 'beauty',
    label: 'Beauty',
    name: 'Beauty i njega',
    note: 'Saloni, tretmani i individualne usluge.',
  },
  {
    id: 'sport',
    label: 'Sport',
    name: 'Sport i aktivnosti',
    note: 'Aktivnosti koje žele biti javno pronađene.',
  },
  {
    id: 'health',
    label: 'Zdravlje',
    name: 'Zdravlje',
    note: 'Terapije i usluge s terminima.',
  },
  {
    id: 'workshop',
    label: 'Radionice',
    name: 'Radionice i edukacije',
    note: 'Radionice, tečajevi i edukativni termini.',
  },
  {
    id: 'generic',
    label: 'Ostalo',
    name: 'Ostale usluge',
    note: 'Ostala poslovanja s javnom vidljivošću.',
  },
];

export const discoverCategoryTabs = [
  { id: 'all', label: 'Sve' },
  ...discoverCategories.map(({ id, label }) => ({ id, label })),
];

/** Map API niche / categoryId into public Otkrij categories. */
export function toPublicDiscoverCategory(categoryId) {
  const key = String(categoryId || 'generic');
  if (key === 'playroom') return 'playroom';
  if (key === 'wellness' || key === 'spa') return 'wellness';
  if (key === 'beauty' || key === 'services') return 'beauty';
  if (key === 'sport' || key === 'activities') return 'sport';
  if (key === 'health' || key === 'physio') return 'health';
  if (key === 'workshop' || key === 'education' || key === 'radionica') return 'workshop';
  if (key === 'fitness' || key === 'pilates' || key === 'yoga' || key === 'powerplate') {
    // Membership-first niches only appear if API already opted them into discover.
    return 'sport';
  }
  if (key === 'generic') return 'generic';
  return 'generic';
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
