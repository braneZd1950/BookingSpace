/**
 * Base URL za postojeći Express API (isti kao web `VITE_API_URL`).
 * Expo: postavi EXPO_PUBLIC_API_URL (na fizičkom telefonu koristi LAN IP, ne localhost).
 */
export function getApiBaseUrl() {
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL)
    || (typeof process !== 'undefined' && process.env?.API_URL)
    || '';
  const trimmed = String(fromEnv || '').trim().replace(/\/$/, '');
  return trimmed || 'http://localhost:4001/api';
}
