/**
 * Public Expo env — only `EXPO_PUBLIC_*` is embedded in the client bundle.
 * Mirror of web `VITE_API_URL` semantics: base URL including `/api`.
 */
import { Platform } from 'react-native';

const fallbackApi = 'http://127.0.0.1:4001/api';

const rawApi = (process.env.EXPO_PUBLIC_API_URL || fallbackApi).replace(/\/$/, '');
const isLocalApi = /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.0\.2\.2)(:|\/|$)/i.test(rawApi);
const releaseChannel = process.env.EXPO_PUBLIC_APP_ENV
  || process.env.APP_ENV
  || process.env.EAS_BUILD_PROFILE
  || '';
// Prefer EAS profile / explicit APP_ENV — do not use NODE_ENV alone (Metro may set production locally).
const isProdLike = /^(production|preview)$/i.test(releaseChannel);

if (isProdLike && isLocalApi) {
  throw new Error(
    'EXPO_PUBLIC_API_URL must be a public HTTPS API in production/preview builds (not localhost).',
  );
}

if (isProdLike && !/^https:\/\//i.test(rawApi)) {
  throw new Error('EXPO_PUBLIC_API_URL must use https:// in production/preview builds.');
}

const apiUrl = rawApi;

const configuredWeb = (process.env.EXPO_PUBLIC_WEB_URL || '').replace(/\/$/, '');
if (isProdLike && !configuredWeb) {
  throw new Error('EXPO_PUBLIC_WEB_URL must be set in production/preview builds.');
}
if (isProdLike && configuredWeb && !/^https:\/\//i.test(configuredWeb)) {
  throw new Error('EXPO_PUBLIC_WEB_URL must use https:// in production/preview builds.');
}

function resolveWebOrigin(): string {
  const derived = (
    configuredWeb
    || apiUrl.replace(/\/api$/i, '').replace(':4001', ':5173')
    || 'http://127.0.0.1:5173'
  ).replace(/\/$/, '');

  // Expo web runs in a desktop browser — Vite is often only reachable via localhost,
  // even when EXPO_PUBLIC_WEB_URL uses a LAN IP for physical phones.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const parsed = new URL(derived);
      const isLan = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname);
      if (isLan || parsed.hostname === '0.0.0.0') {
        return `http://127.0.0.1:${parsed.port || '5173'}`;
      }
    } catch {
      return 'http://127.0.0.1:5173';
    }
  }

  return derived;
}

export const env = {
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'anyminutes',
  apiUrl,
  /** Whole-app maintenance gate — mirror of web `VITE_MAINTENANCE`. */
  maintenance: String(process.env.EXPO_PUBLIC_MAINTENANCE || '').toLowerCase() === 'true',
  /** Web app origin for opening /privatnost, /uvjeti, /register, etc. */
  webOrigin: resolveWebOrigin(),
  /** Google OAuth web client ID (GIS / Expo). */
  googleClientId: (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '').trim(),
  googleIosClientId: (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '').trim(),
  googleAndroidClientId: (process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '').trim(),
} as const;
