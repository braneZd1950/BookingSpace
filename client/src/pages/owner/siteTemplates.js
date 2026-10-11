/** Website templates for providers — map to layout + default palette. */
export const SITE_HOST = 'booking.hr';

export function studioHost(slug) {
  const clean = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return clean ? `${clean}.${SITE_HOST}` : `vas-studio.${SITE_HOST}`;
}

/** 5 predložaka za početak. */
export const siteTemplates = [
  {
    id: 'fitness',
    name: 'Fitness',
    note: 'Velika naslovnica, termini ispod, jak gumb za rezervaciju.',
    layout: 'banner',
    palette: 'navy',
    niches: ['fitness'],
  },
  {
    id: 'powerplate',
    name: 'Power Plate',
    note: 'Naslovnica s naglaskom na termine i kapacitet grupe.',
    layout: 'banner',
    palette: 'ember',
    niches: ['powerplate'],
  },
  {
    id: 'pilates',
    name: 'Pilates / yoga',
    note: 'Mirniji ritam, bočni stupac za sate i kontakt.',
    layout: 'sidebar',
    palette: 'pine',
    niches: ['pilates', 'yoga'],
  },
  {
    id: 'playroom',
    name: 'Igraonica',
    note: 'Uski header — brzo do termina i kontakta.',
    layout: 'bar',
    palette: 'clay',
    niches: ['playroom'],
  },
  {
    id: 'generic',
    name: 'Usluge',
    note: 'Univerzalni izgled za salon, tečaj ili studio.',
    layout: 'banner',
    palette: 'stone',
    niches: ['generic'],
  },
];

export function findTemplate(id) {
  return siteTemplates.find((item) => item.id === id) || siteTemplates[0];
}

export function templateForNiche(niche) {
  return siteTemplates.find((item) => item.niches.includes(niche)) || siteTemplates[0];
}

/** Niche for API from chosen template. */
export function nicheFromTemplate(templateId) {
  const item = findTemplate(templateId);
  return item.niches[0] || 'generic';
}
