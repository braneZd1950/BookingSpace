/**
 * URL za gumb „Preuzmite aplikaciju” na marketing početnoj.
 *
 * Trenutno: web distribucija (nema App Store / Play).
 * - VITE_MOBILE_APP_URL ako je postavljen (npr. Expo web host)
 * - DEV bez env → lokalni Expo web
 * - produkcija bez env → /mobile (stranica unutar web app)
 */
export function getMobileAppUrl() {
  const fromEnv = String(import.meta.env.VITE_MOBILE_APP_URL || '').trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return 'http://localhost:8083';
  return '/mobile';
}

/** Direct Expo / mobile-web host when different from the /mobile landing. */
export function getMobileWebOpenUrl() {
  const explicit = String(import.meta.env.VITE_MOBILE_WEB_URL || '').trim();
  if (explicit) return explicit;
  const appUrl = String(import.meta.env.VITE_MOBILE_APP_URL || '').trim();
  if (appUrl && appUrl !== '/mobile' && !appUrl.endsWith('/mobile')) {
    return appUrl;
  }
  if (import.meta.env.DEV) return 'http://localhost:8083';
  return '';
}

export function isExternalAppUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}
