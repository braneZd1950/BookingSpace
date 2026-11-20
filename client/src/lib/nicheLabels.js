/** Short public labels for tenant niche on studio home / discover. */
const NICHE_LABELS = {
  fitness: 'Fitness studio',
  powerplate: 'Power Plate',
  pilates: 'Pilates studio',
  yoga: 'Yoga studio',
  playroom: 'Igraonica',
  services: 'Salon i usluge',
  wellness: 'Wellness',
  spa: 'Spa',
  beauty: 'Salon',
  health: 'Zdravlje',
  sport: 'Sport i aktivnosti',
  workshop: 'Radionice',
  generic: 'Poslovanje',
};

export function nicheLabel(niche, nicheCustom = '') {
  const custom = String(nicheCustom || '').trim();
  if (custom) return custom;
  const key = String(niche || 'generic').toLowerCase();
  return NICHE_LABELS[key] || NICHE_LABELS.generic;
}

export function nichePlaceLine(niche, nicheCustom, city) {
  const kind = nicheLabel(niche, nicheCustom);
  const place = String(city || '').trim();
  return place ? `${kind} · ${place}` : kind;
}
