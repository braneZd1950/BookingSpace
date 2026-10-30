/** Website templates for providers — map to layout, palette and sections. */
export const SITE_HOST = 'booking.hr';

export function studioHost(slug) {
  const clean = String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
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
    note: 'Široka naslovnica, termini ispod, jak poziv na rezervaciju.',
    layout: 'banner',
    palette: 'navy',
    niches: ['fitness', 'powerplate'],
    sections: { ...allOn, gallery: true },
  },
  {
    id: 'pilates',
    name: 'Mirniji ritam',
    note: 'Bočni stupac za sate i kontakt — pilates, yoga, manje grupe.',
    layout: 'sidebar',
    palette: 'teal',
    niches: ['pilates', 'yoga'],
    sections: { ...allOn, gallery: false, services: true },
  },
  {
    id: 'services',
    name: 'Pojedinačni termini',
    note: 'Naglasak na uslugu i trajanje — frizer, beauty, masaža, PT.',
    layout: 'sidebar',
    palette: 'wine',
    niches: ['services'],
    sections: { ...allOn, gallery: true, schedule: true },
  },
  {
    id: 'playroom',
    name: 'Igraonica i događaji',
    note: 'Uski header — brzo do termina i kontakta.',
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
    note: 'Jednostavan izgled za sve što ne spada u ostale predloške.',
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
