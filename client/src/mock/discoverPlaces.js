/**
 * Development fallback for member Discover (/s/:slug/otkrij).
 * Live data comes from GET /api/tenants/discover; mock fills gaps in DEV only.
 */

export const DISCOVER_MOCK_ENABLED = import.meta.env.DEV;

export const discoverCategories = [
  {
    id: 'fitness',
    index: '01',
    name: 'Treninzi i wellness',
    note: 'Fitness, pilates, yoga, Power Plate i grupni treninzi.',
  },
  {
    id: 'services',
    index: '02',
    name: 'Pojedinačni termini',
    note: 'Beauty, masaže, frizeri, fizioterapija, personalni treneri.',
  },
  {
    id: 'playroom',
    index: '03',
    name: 'Igraonice i događaji',
    note: 'Rođendani, sati igre i najam prostora.',
  },
  {
    id: 'generic',
    index: '04',
    name: 'Ostalo',
    note: 'Ostale rezervacije koje ne spadaju u gornje grupe.',
  },
];

/** @typedef {{ id: string, categoryId: string, name: string, city: string, area?: string, note: string, tags?: string[], slug?: string, live?: boolean }} DiscoverPlace */

/** @type {DiscoverPlace[]} */
export const discoverPlaces = [
  {
    id: 'fit-pulse',
    categoryId: 'fitness',
    name: 'Pulse Atelier',
    city: 'Zagreb',
    area: 'Trešnjevka',
    note: 'HIIT i Power Plate u manjim grupama.',
    tags: ['fitness', 'powerplate'],
    slug: 'demo-fitness',
    live: true,
  },
  {
    id: 'fit-flow',
    categoryId: 'fitness',
    name: 'Flow Studio',
    city: 'Split',
    area: 'Bačvice',
    note: 'Yoga i pilates — jutarnji i večernji blokovi.',
    tags: ['yoga', 'pilates'],
    slug: 'flow-studio-split',
    live: false,
  },
  {
    id: 'fit-core',
    categoryId: 'fitness',
    name: 'Core & Calm',
    city: 'Rijeka',
    area: 'Centar',
    note: 'Funkcionalni treninzi i mobilnost.',
    tags: ['fitness', 'wellness'],
    slug: 'core-calm-rijeka',
    live: false,
  },
  {
    id: 'fit-nord',
    categoryId: 'fitness',
    name: 'Nordic Move',
    city: 'Osijek',
    note: 'Grupni treninzi i članarine po paketima.',
    tags: ['fitness'],
    slug: 'nordic-move',
    live: false,
  },
  {
    id: 'svc-lumen',
    categoryId: 'services',
    name: 'Lumen Beauty',
    city: 'Zagreb',
    area: 'Donji grad',
    note: 'Frizerski i beauty termini po trajanju.',
    tags: ['beauty', 'frizer'],
    slug: 'lumen-beauty',
    live: false,
  },
  {
    id: 'svc-olive',
    categoryId: 'services',
    name: 'Olive Masaža',
    city: 'Zadar',
    note: 'Masaže i fizioterapija — jedan klijent po terminu.',
    tags: ['masaža', 'fizioterapija'],
    slug: 'olive-masaza',
    live: false,
  },
  {
    id: 'svc-blade',
    categoryId: 'services',
    name: 'Blade Barbers',
    city: 'Zagreb',
    area: 'Maksimir',
    note: 'Muško šišanje i brada — brzi slotovi.',
    tags: ['frizer'],
    slug: 'blade-barbers',
    live: false,
  },
  {
    id: 'svc-physio',
    categoryId: 'services',
    name: 'Kinetik Fizikal',
    city: 'Varaždin',
    note: 'Fizioterapija s trajanjem usluge.',
    tags: ['fizioterapija'],
    slug: 'kinetik-fizikal',
    live: false,
  },
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
  },
  {
    id: 'play-kiddo',
    categoryId: 'playroom',
    name: 'Kiddo Room',
    city: 'Split',
    note: 'Najam prostora i tematske proslave.',
    tags: ['igraonica'],
    slug: 'kiddo-room',
    live: false,
  },
  {
    id: 'play-little',
    categoryId: 'playroom',
    name: 'Little Nest',
    city: 'Rijeka',
    note: 'Mali prostori za privatne sate igre.',
    tags: ['igraonica'],
    slug: 'little-nest',
    live: false,
  },
  {
    id: 'gen-atelier',
    categoryId: 'generic',
    name: 'Atelier Knjige',
    city: 'Zagreb',
    note: 'Radionice i rezervacija mjesta za večernje grupe.',
    tags: ['radionica'],
    slug: 'atelier-knjige',
    live: false,
  },
  {
    id: 'gen-lab',
    categoryId: 'generic',
    name: 'Craft Lab',
    city: 'Pula',
    note: 'Kreativne radionice — termini po satima.',
    tags: ['radionica'],
    slug: 'craft-lab',
    live: false,
  },
];

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
