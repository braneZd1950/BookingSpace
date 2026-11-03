/**
 * Direct Android APK (or future store) download from the marketing site.
 * Set VITE_APP_ANDROID_URL to a full HTTPS URL or a path under /downloads/.
 */
const raw = String(import.meta.env.VITE_APP_ANDROID_URL || '/downloads/anyminutes.apk').trim();

export const ANDROID_APP_DOWNLOAD_URL = raw || '/downloads/anyminutes.apk';

export function isExternalAppDownload(url = ANDROID_APP_DOWNLOAD_URL) {
  return /^https?:\/\//i.test(url);
}

/**
 * Probe whether the APK responds. Cross-origin URLs cannot be checked reliably
 * from the browser (CORS) — treat them as available. Same-origin 404 → unavailable.
 */
export async function probeAndroidDownload(url = ANDROID_APP_DOWNLOAD_URL) {
  if (typeof window === 'undefined') return true;

  const absolute = /^https?:\/\//i.test(url)
    ? url
    : new URL(url, window.location.origin).href;

  if (new URL(absolute).origin !== window.location.origin) {
    return true;
  }

  try {
    const head = await fetch(absolute, { method: 'HEAD', cache: 'no-store' });
    if (head.ok) return true;
    if (head.status === 405 || head.status === 501) {
      const ranged = await fetch(absolute, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        cache: 'no-store',
      });
      return ranged.ok || ranged.status === 206;
    }
    return false;
  } catch {
    return false;
  }
}
