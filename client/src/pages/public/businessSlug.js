export function previewSlug(name) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export const niches = [
  ['fitness', 'Treninzi i grupe'],
  ['services', 'Pojedinačni termini'],
  ['playroom', 'Igraonice i događaji'],
  ['generic', 'Nešto drugo'],
];
