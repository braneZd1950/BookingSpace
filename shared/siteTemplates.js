/** Website templates for providers — map to layout, palette and sections. */
export const SITE_HOST = 'booking.hr';

export function previewSlug(name) {
  const raw = String(name || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return raw;
}

export function studioHost(slug) {
  const clean = previewSlug(slug);
  return clean ? `${clean}.${SITE_HOST}` : `vas-studio.${SITE_HOST}`;
}

const allOn = {
  hero: true,
  about: true,
  services: true,
  schedule: true,
  gallery: true,
  contact: true,
  location: true,
  openingHours: true,
};

/** Niše za registraciju — id mora biti u server NICHES. */
export const signupNiches = [
  {
    id: 'fitness',
    name: 'Treninzi i grupe',
    note: 'Fitness, Power Plate, pilates, yoga, tečajevi, ples. Raspored s kapacitetom i članarinama.',
  },
  {
    id: 'services',
    name: 'Pojedinačni termini',
    note: 'Frizeri, beauty, masaže, fizioterapija, personalni treneri. Usluga s trajanjem, klijent dolazi sam.',
  },
  {
    id: 'playroom',
    name: 'Igraonice i događaji',
    note: 'Rođendani, sati igre, najam prostora. Brza rezervacija — cijeli termin za jednu obitelj.',
  },
  {
    id: 'generic',
    name: 'Nešto drugo',
    note: 'Za sve što se ne uklopi — nitko ne ostaje izvan popisa.',
  },
];

export function findSignupNiche(id) {
  return signupNiches.find((item) => item.id === id) || signupNiches[0];
}

/** Predlošci: raspored + boja + koje sekcije su uključene. */
export const siteTemplates = [
  {
    id: 'fitness',
    name: 'Treninzi i grupe',
    note: 'Široka naslovnica, termini ispod.',
    layout: 'banner',
    palette: 'navy',
    niches: ['fitness', 'powerplate'],
    sections: { ...allOn, gallery: true },
  },
  {
    id: 'pilates',
    name: 'Mirniji ritam',
    note: 'Bočni stupac. Za pilates, jogu i manje grupe.',
    layout: 'sidebar',
    palette: 'teal',
    niches: ['pilates', 'yoga'],
    sections: { ...allOn, gallery: false, services: true },
  },
  {
    id: 'services',
    name: 'Pojedinačni termini',
    note: 'Naglasak na uslugu i trajanje.',
    layout: 'sidebar',
    palette: 'wine',
    niches: ['services'],
    sections: { ...allOn, gallery: true, schedule: true },
  },
  {
    id: 'playroom',
    name: 'Igraonica i događaji',
    note: 'Uski header, brzo do termina.',
    layout: 'bar',
    palette: 'sky',
    niches: ['playroom'],
    sections: {
      ...allOn,
      gallery: true,
      services: false,
      about: true,
    },
  },
  {
    id: 'generic',
    name: 'Univerzalni',
    note: 'Jednostavan izgled za sve ostalo.',
    layout: 'banner',
    palette: 'stone',
    niches: ['generic'],
    sections: { ...allOn, gallery: false },
  },
];

export function findTemplate(id) {
  if (id === 'powerplate') {
    return siteTemplates.find((item) => item.id === 'fitness') || siteTemplates[0];
  }
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

export function templatesForNiche(niche) {
  return [...siteTemplates].sort((a, b) => {
    const aMatch = a.niches.includes(niche) ? 0 : 1;
    const bMatch = b.niches.includes(niche) ? 0 : 1;
    return aMatch - bMatch;
  });
}

export const pageLayouts = [
  {
    id: 'banner',
    name: 'Naslovnica',
    note: 'Široki header, ispod termini, sati i kontakt.',
  },
  {
    id: 'bar',
    name: 'Traka',
    note: 'Uski header, sadržaj kreće odmah ispod.',
  },
  {
    id: 'sidebar',
    name: 'Stupac',
    note: 'Header s bočnom trakom za kontakt i sate.',
  },
];

export function findLayout(id) {
  return pageLayouts.find((item) => item.id === id) || pageLayouts[0];
}
