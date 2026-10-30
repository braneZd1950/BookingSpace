/**
 * Jedno mjesto za razlikovanje lokalnog testa i produkcije (Render / pravi korisnici).
 *
 * - DEV (Vite): mock Otkrij, demo tipke na loginu, PDF oznaka „LOKALNI TEST”.
 * - PROD build: samo živi API podaci; PDF je službena arhivska kopija.
 *
 * Opcionalno: VITE_APP_MODE=staging|production|development (override pri buildu).
 */
const modeRaw = String(import.meta.env.VITE_APP_MODE || '').trim().toLowerCase();

export const IS_DEV = Boolean(import.meta.env.DEV);
export const IS_PROD_BUILD = Boolean(import.meta.env.PROD);

export const APP_MODE = modeRaw || (IS_PROD_BUILD ? 'production' : 'development');

/** Službeni PDF / produkcijsko ponašanje (ne lokalni seed/mock). */
export const IS_LIVE = APP_MODE === 'production' && IS_PROD_BUILD;

/** Lokalni ili staging ispis — PDF i UI smiju označiti test. */
export const IS_LOCAL_TEST = !IS_LIVE;

export function publicAsset(pathName) {
  const base = import.meta.env.BASE_URL || '/';
  const clean = String(pathName || '').replace(/^\//, '');
  return `${base}${clean}`.replace(/\/{2,}/g, '/');
}
