/** Website templates for providers — map to layout, palette and sections. */
export const SITE_HOST = 'booking.hr';

function trimSlugDashes(value) {
  let text = String(value || '');
  while (text.startsWith('-')) text = text.slice(1);
  while (text.endsWith('-')) text = text.slice(0, -1);
  return text;
}

/** ASCII slug preview for studio hostnames (no ReDoS trim regex). */
export function previewSlug(name) {
  const raw = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60);
  return trimSlugDashes(raw);
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
    name: 'Treninzi i grupne aktivnosti',
    note: 'Fitness, Power Plate, pilates, joga, tečajevi i ples.',
  },
  {
    id: 'services',
    name: 'Pojedinačne usluge',
    note: 'Frizerski i kozmetički saloni, masaže, fizioterapija i osobni treninzi.',
  },
  {
    id: 'playroom',
    name: 'Igraonice i događanja',
    note: 'Dječji rođendani, proslave, sati igre i najam prostora.',
  },
  {
    id: 'generic',
    name: 'Druga djelatnost',
    note: 'Za sve ostale vrste poslovanja. Blizari je namijenjen različitim uslužnim djelatnostima.',
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
    note: 'Široka naslovnica s pregledom grupnih aktivnosti i dostupnih termina.',
    layout: 'banner',
    palette: 'navy',
    niches: ['fitness', 'powerplate'],
    sections: { ...allOn, gallery: true },
  },
  {
    id: 'pilates',
    name: 'Mirniji ritam',
    note: 'Jednostavan i smiren izgled za pilates, jogu i manje grupe.',
    layout: 'sidebar',
    palette: 'teal',
    niches: ['pilates', 'yoga'],
    sections: { ...allOn, gallery: false, services: true },
  },
  {
    id: 'services',
    name: 'Pojedinačni termini',
    note: 'Naglasak na uslugama, trajanju i odabiru termina.',
    layout: 'sidebar',
    palette: 'lavender',
    niches: ['services'],
    sections: { ...allOn, gallery: true, schedule: true },
  },
  {
    id: 'playroom',
    name: 'Igraonice i događaji',
    note: 'Brz pristup rezervaciji rođendana, proslava i prostora.',
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
    note: 'Jednostavan i prilagodljiv izgled za različite djelatnosti.',
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
    note: 'Široka naslovna sekcija, a ispod nje usluge, termini i kontakt.',
  },
  {
    id: 'bar',
    name: 'Traka',
    note: 'Kompaktan zaglavni dio. Sadržaj i termini odmah su u prvom planu.',
  },
  {
    id: 'sidebar',
    name: 'Stupac',
    note: 'Bočna traka s informacijama, radnim vremenom i kontaktom.',
  },
];

export function findLayout(id) {
  return pageLayouts.find((item) => item.id === id) || pageLayouts[0];
}
