/**
 * Web distribucija mobilne app bez storeova:
 * 1) VITE_MOBILE_APK_URL → na Androidu otvori APK (instalacija), na desktopu uputa
 * 2) inače PWA install prompt (Chrome/Android)
 *
 * Napomena: APK je ZIP format — ne extraktati na Windowsu. Instalira se samo na Androidu.
 */

let deferredInstallPrompt = null;

export function getMobileApkUrl() {
  return String(import.meta.env.VITE_MOBILE_APK_URL || '').trim();
}

export function isAndroidBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
}

export function isDirectApkUrl(url) {
  return /\.apk(\?|#|$)/i.test(String(url || ''));
}

/** Call once from app boot to capture the browser install event. */
export function armAppInstallListener() {
  if (typeof window === 'undefined') return () => {};
  const onPrompt = (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.dispatchEvent(new CustomEvent('anyminutes:appinstall-ready'));
  };
  window.addEventListener('beforeinstallprompt', onPrompt);
  return () => window.removeEventListener('beforeinstallprompt', onPrompt);
}

export function hasDeferredAppInstall() {
  return Boolean(deferredInstallPrompt);
}

export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/i.test(ua);
  const discarded = /CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
  return iOS && webkit && !discarded;
}

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  );
}

/**
 * @returns {Promise<
 *   'apk-android'|'apk-desktop'|'expo-link'|'installed'|'accepted'|
 *   'dismissed'|'ios-hint'|'unavailable'|'already'
 * >}
 */
export async function installOrDownloadApp() {
  if (isStandaloneDisplay()) return 'already';

  const apk = getMobileApkUrl();
  if (apk) {
    const direct = isDirectApkUrl(apk);
    const android = isAndroidBrowser();

    // Desktop: do not force APK download (Windows treats APK as broken ZIP).
    if (!android && direct) {
      return 'apk-desktop';
    }

    // Android: NEVER use the HTML download attribute for APK.
    // That only saves the file; "Open" then shows content:// blank page.
    // Navigating to the APK URL lets Chrome hand off to the package installer.
    if (android && direct) {
      window.location.assign(apk);
      return 'apk-android';
    }

    // Expo build page / non-direct URL
    const link = document.createElement('a');
    link.href = apk;
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return 'expo-link';
  }

  if (deferredInstallPrompt) {
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    return choice?.outcome === 'accepted' ? 'accepted' : 'dismissed';
  }

  if (isIosSafari()) return 'ios-hint';
  return 'unavailable';
}
