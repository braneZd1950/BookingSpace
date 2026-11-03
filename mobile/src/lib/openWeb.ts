import { Alert, Linking, Platform } from 'react-native';
import { env } from '../config/env';

export function webUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${env.webOrigin}${normalized}`;
}

/**
 * Open a marketing/legal page on the web app.
 * - Expo web: same-tab navigation (popup blockers block window.open)
 * - Native: system browser via Linking (skip canOpenURL — false negatives on http)
 */
export async function openWebPath(path: string): Promise<void> {
  const url = webUrl(path);

  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Same tab — reliable under Expo web; _blank is often blocked.
      window.location.assign(url);
      return;
    }

    await Linking.openURL(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Last resort if assign throws (rare)
      try {
        window.location.href = url;
        return;
      } catch {
        /* fall through */
      }
    }
    Alert.alert(
      'Veza nije dostupna',
      `Ne možemo otvoriti ${url}. Provjerite da web radi (npm run dev) i EXPO_PUBLIC_WEB_URL.\n${message}`,
    );
  }
}
