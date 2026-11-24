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
  if (trimmed) return trimmed;

  const isRelease = typeof __DEV__ !== 'undefined'
    ? !__DEV__
    : (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');
  if (isRelease) {
    throw new Error('EXPO_PUBLIC_API_URL must be set for production / release builds.');
  }
  return 'http://localhost:4001/api';
}
