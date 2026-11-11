/** Niše, predlošci i boje za mobilnu registraciju / postavljanje partnera. */

export const signupNiches = [
  {
    id: 'fitness',
    name: 'Treninzi i grupe',
    note: 'Fitness, pilates, yoga, tečajevi — raspored i članarine.',
  },
  {
    id: 'services',
    name: 'Pojedinačni termini',
    note: 'Frizeri, beauty, masaže, PT — usluga s trajanjem.',
  },
  {
    id: 'playroom',
    name: 'Igraonice i događaji',
    note: 'Rođendani, sati igre, najam prostora.',
  },
  {
    id: 'generic',
    name: 'Nešto drugo',
    note: 'Za sve što se ne uklopi u ostale kategorije.',
  },
];

export const pageLayouts = [
  {
    id: 'banner',
    name: 'Naslovnica',
    note: 'Široki header. Ispod: termini, sati i kontakt.',
  },
  {
    id: 'bar',
    name: 'Traka',
    note: 'Uski header. Sadržaj kreće odmah ispod.',
  },
  {
    id: 'sidebar',
    name: 'Stupac',
    note: 'Header + bočna traka za kontakt i sate.',
  },
];

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
    note: 'Bočni stupac — pilates, yoga, manje grupe.',
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
    note: 'Uski header — brzo do termina.',
    layout: 'bar',
    palette: 'sky',
    niches: ['playroom'],
    sections: { ...allOn, gallery: true, services: false, about: true },
  },
  {
    id: 'generic',
    name: 'Univerzalni',
    note: 'Jednostavan izgled za ostalo.',
    layout: 'banner',
    palette: 'stone',
    niches: ['generic'],
    sections: { ...allOn, gallery: false },
  },
];

const palette = (id, name, primary, soft, canvas, ink) => ({
  id,
  name,
  theme: { primaryColor: primary, secondaryColor: soft, canvas, ink, onPrimary: '#ffffff' },
});

export const studioPalettes = [
  palette('navy', 'Tamnoplava', '#243056', '#d9e0ef', '#f6f7fb', '#1c2233'),
  palette('cobalt', 'Kobalt', '#2a4e8f', '#d4e2f7', '#f5f8fc', '#172033'),
  palette('sky', 'Nebo', '#0068ac', '#d6eaf8', '#f3f8fc', '#0f2f45'),
  palette('teal', 'Petrol', '#0e6b73', '#dceff0', '#f4f9f9', '#123238'),
  palette('emerald', 'Smaragd', '#006e54', '#d6f2e8', '#f2faf7', '#0f3228'),
  palette('pine', 'Bor', '#3e5c45', '#d5e3d4', '#f5f7f3', '#1c261e'),
  palette('wine', 'Vino', '#7a3048', '#f0d5de', '#fbf7f8', '#2c1a22'),
  palette('rose', 'Ruza', '#9a4a5c', '#f2dce2', '#fbf6f7', '#321c22'),
  palette('plum', 'Šljiva', '#5a3d6b', '#e6d9ef', '#f8f6fa', '#24182c'),
  palette('mandarin', 'Mandarina', '#ac4c06', '#fdead8', '#fcf7f2', '#3a220e'),
  palette('sand', 'Pijesak', '#9a7b4f', '#efe4d0', '#faf7f1', '#2c2418'),
  palette('stone', 'Kamen', '#3a3f45', '#e3e1dc', '#f7f6f4', '#1e2124'),
  palette('slate', 'Škriljavac', '#4a5560', '#dde2e6', '#f5f6f7', '#1c2228'),
  palette('ink', 'Tinta', '#1a1a1a', '#e4e4e4', '#f7f7f7', '#141414'),
  palette('ember', 'Žar', '#b33b2e', '#f3d5d0', '#fbf5f4', '#2c1614'),
  palette('apple', 'Jabuka', '#26702c', '#def0dc', '#f4faf3', '#17301a'),
  palette('honey', 'Med', '#925c00', '#fcf0d4', '#fbf8f0', '#35260c'),
  palette('raspberry', 'Malina', '#ac1e60', '#fbdeeb', '#fcf5f8', '#3a1024'),
];

const nichePaletteIds = {
  fitness: ['navy', 'stone', 'ink', 'ember', 'mandarin'],
  services: ['wine', 'rose', 'plum', 'sand', 'lavender'],
  playroom: ['sky', 'apple', 'mandarin', 'honey', 'raspberry'],
  generic: ['stone', 'slate', 'navy', 'pine', 'sand'],
  pilates: ['teal', 'pine', 'emerald', 'lavender', 'sand'],
  yoga: ['teal', 'pine', 'emerald', 'lavender', 'sand'],
};

// lavender/pine aliases for recommended lists
studioPalettes.push(
  palette('lavender', 'Lavanda', '#624ca2', '#ece6fa', '#f7f5fc', '#241c3a'),
);

export function findSignupNiche(id) {
  return signupNiches.find((item) => item.id === id) || signupNiches[0];
}

export function findTemplate(id) {
  return siteTemplates.find((item) => item.id === id) || siteTemplates[0];
}

export function templateForNiche(niche) {
  return siteTemplates.find((item) => item.niches.includes(niche)) || siteTemplates[0];
}

export function findLayout(id) {
  return pageLayouts.find((item) => item.id === id) || pageLayouts[0];
}

export function findPalette(id) {
  return studioPalettes.find((item) => item.id === id) || studioPalettes[0];
}

export function defaultsForNiche(nicheId) {
  const item = templateForNiche(nicheId);
  const recommended = nichePaletteIds[nicheId] || nichePaletteIds.generic;
  return {
    template: item.id,
    layout: item.layout,
    paletteId: recommended[0] || item.palette,
    visibleSections: { ...item.sections },
  };
}

export function palettesForNiche(niche) {
  const preferred = nichePaletteIds[niche] || nichePaletteIds.generic;
  const preferredSet = new Set(preferred);
  const first = preferred.map((id) => findPalette(id)).filter(Boolean);
  const rest = studioPalettes.filter((item) => !preferredSet.has(item.id));
  return { recommendedIds: preferred, palettes: [...first, ...rest] };
}

export function templatesForNiche(niche) {
  return [...siteTemplates].sort((a, b) => {
    const aMatch = a.niches.includes(niche) ? 0 : 1;
    const bMatch = b.niches.includes(niche) ? 0 : 1;
    return aMatch - bMatch;
  });
}

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
  return clean ? `${clean}.booking.hr` : 'vas-studio.booking.hr';
}
