/** Public Otkrij categories — aligned with web DiscoverPage. */

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
