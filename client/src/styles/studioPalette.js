const siteType = 'Figtree, sans-serif';

function palette(id, name, primary, soft, canvas, ink) {
  return {
    id,
    name,
    theme: {
      primaryColor: primary,
      secondaryColor: soft,
      fontFamily: siteType,
      borderRadius: '0.5rem',
      buttonStyle: 'soft',
      canvas,
      ink,
      onPrimary: '#ffffff',
    },
  };
}

/** ~25 nijansi: tamna glavna + svijetla podloga (bijeli tekst na glavnoj). */
export const studioPalettes = [
  palette('navy', 'Tamnoplava', '#243056', '#d9e0ef', '#f6f7fb', '#1c2233'),
  palette('cobalt', 'Kobalt', '#2a4e8f', '#d4e2f7', '#f5f8fc', '#172033'),
  palette('ocean', 'Ocean', '#1a5f7a', '#cfe6ef', '#f3f8fa', '#14323d'),
  palette('sky', 'Nebo', '#0068ac', '#d6eaf8', '#f3f8fc', '#0f2f45'),
  palette('teal', 'Petrol', '#0e6b73', '#dceff0', '#f4f9f9', '#123238'),
  palette('emerald', 'Smaragd', '#006e54', '#d6f2e8', '#f2faf7', '#0f3228'),
  palette('pine', 'Bor', '#3e5c45', '#d5e3d4', '#f5f7f3', '#1c261e'),
  palette('apple', 'Jabuka', '#26702c', '#def0dc', '#f4faf3', '#17301a'),
  palette('moss', 'Mahovina', '#4a6b3a', '#dce8d4', '#f6f9f3', '#22301c'),
  palette('olive', 'Maslina', '#6b6b3a', '#e6e6d0', '#f8f8f2', '#2c2c1a'),
  palette('wine', 'Vino', '#7a3048', '#f0d5de', '#fbf7f8', '#2c1a22'),
  palette('rose', 'Ruza', '#9a4a5c', '#f2dce2', '#fbf6f7', '#321c22'),
  palette('raspberry', 'Malina', '#ac1e60', '#fbdeeb', '#fcf5f8', '#3a1024'),
  palette('plum', 'Šljiva', '#5a3d6b', '#e6d9ef', '#f8f6fa', '#24182c'),
  palette('lavender', 'Lavanda', '#624ca2', '#ece6fa', '#f7f5fc', '#241c3a'),
  palette('violet', 'Ljubičasta', '#4f3d8f', '#ddd6f5', '#f6f5fb', '#1f1a33'),
  palette('clay', 'Glina', '#a35b3c', '#f0ddcf', '#faf6f2', '#2b211c'),
  palette('mandarin', 'Mandarina', '#ac4c06', '#fdead8', '#fcf7f2', '#3a220e'),
  palette('copper', 'Bakar', '#8f4e2a', '#f3e4c8', '#fbf8f3', '#2a2118'),
  palette('honey', 'Med', '#925c00', '#fcf0d4', '#fbf8f0', '#35260c'),
  palette('sand', 'Pijesak', '#9a7b4f', '#efe4d0', '#faf7f1', '#2c2418'),
  palette('stone', 'Kamen', '#3a3f45', '#e3e1dc', '#f7f6f4', '#1e2124'),
  palette('slate', 'Škriljavac', '#4a5560', '#dde2e6', '#f5f6f7', '#1c2228'),
  palette('ink', 'Tinta', '#1a1a1a', '#e4e4e4', '#f7f7f7', '#141414'),
  palette('ember', 'Žar', '#b33b2e', '#f3d5d0', '#fbf5f4', '#2c1614'),
];

/** Pet preporuka po niši — prve u traci, ostale i dalje dostupne. */
export const nichePaletteIds = {
  fitness: ['navy', 'stone', 'ink', 'ember', 'mandarin'],
  powerplate: ['ember', 'navy', 'stone', 'ink', 'mandarin'],
  pilates: ['teal', 'pine', 'emerald', 'lavender', 'sand'],
  yoga: ['teal', 'pine', 'emerald', 'lavender', 'sand'],
  services: ['wine', 'rose', 'plum', 'sand', 'lavender'],
  playroom: ['sky', 'apple', 'mandarin', 'honey', 'raspberry'],
  generic: ['stone', 'slate', 'navy', 'pine', 'sand'],
};

export function findPalette(id) {
  return studioPalettes.find((item) => item.id === id) || studioPalettes[0];
}

export function recommendedPaletteIds(niche) {
  return nichePaletteIds[niche] || nichePaletteIds.generic;
}

/** Preporučene prve, zatim ostale — bez duplikata. */
export function palettesForNiche(niche) {
  const preferred = recommendedPaletteIds(niche);
  const preferredSet = new Set(preferred);
  const first = preferred.map((id) => findPalette(id)).filter(Boolean);
  const rest = studioPalettes.filter((item) => !preferredSet.has(item.id));
  return { recommendedIds: preferred, palettes: [...first, ...rest] };
}

export function themePayload(theme) {
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    fontFamily: theme.fontFamily,
    borderRadius: theme.borderRadius,
    buttonStyle: theme.buttonStyle,
  };
}
