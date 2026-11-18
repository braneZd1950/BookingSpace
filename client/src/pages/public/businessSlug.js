function trimDashes(value) {
  let text = String(value || '');
  while (text.startsWith('-')) text = text.slice(1);
  while (text.endsWith('-')) text = text.slice(0, -1);
  return text;
}

export function previewSlug(name) {
  const raw = name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 60);
  return trimDashes(raw);
}

export const niches = [
  ['fitness', 'Treninzi i grupne aktivnosti'],
  ['services', 'Pojedinačne usluge'],
  ['playroom', 'Igraonice i događanja'],
  ['generic', 'Druga djelatnost'],
];
