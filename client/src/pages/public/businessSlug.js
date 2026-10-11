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
  ['fitness', 'Fitness / teretana'],
  ['pilates', 'Pilates'],
  ['yoga', 'Yoga'],
  ['powerplate', 'Power Plate'],
  ['playroom', 'Igraonica'],
  ['generic', 'Ostalo (salon, tečaj, usluge)'],
];
