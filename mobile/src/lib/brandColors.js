/**
 * Blizari brand palette — shared by theme tokens and chrome defaults.
 * Primary blue #2563EB · Teal #14B8A6 · Soft #E0F2FE · Navy #0F172A
 */
export const BRAND = {
  blue: '#2563EB',
  teal: '#14B8A6',
  soft: '#E0F2FE',
  navy: '#0F172A',
  navySoft: '#1E293B',
  onDark: '#F8FAFC',
  onTeal: '#042F2E',
  blueBright: '#60A5FA',
  tealBright: '#2DD4BF',
};

export const DARK_SURFACE = {
  bg: BRAND.navy,
  /** Brand blue → navy — matches web header / logo (blue + teal). */
  gradient: ['#1E40AF', '#15233B', BRAND.navy],
  accent: BRAND.teal,
  accentBright: BRAND.tealBright,
  cta: BRAND.blue,
};

export const LIGHT_SURFACE = {
  bg: '#F0F9FF',
  /** Soft sky like web Otkrij / tokens --bg. */
  gradient: [BRAND.soft, '#F8FBFF', '#F0F9FF'],
  accent: BRAND.blue,
  accentTeal: BRAND.teal,
  cta: BRAND.blue,
};
