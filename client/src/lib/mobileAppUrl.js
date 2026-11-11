/**
 * URL za gumb „Preuzmite aplikaciju” na marketing početnoj.
 * Produkcija: App Store / Play / landing (VITE_MOBILE_APP_URL).
 * Lokalno bez env: Expo web na 8083 radi testiranja.
 */
export function getMobileAppUrl() {
  const fromEnv = String(import.meta.env.VITE_MOBILE_APP_URL || '').trim();
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return 'http://localhost:8083';
  return '';
}

export function isExternalAppUrl(url) {
  return /^https?:\/\//i.test(String(url || ''));
}
