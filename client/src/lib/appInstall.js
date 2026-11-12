/**
 * Web distribucija mobilne app bez storeova:
 * 1) VITE_MOBILE_APK_URL → direktno preuzimanje APK-a
 * 2) inače PWA install prompt (Chrome/Android)
 */

let deferredInstallPrompt = null;

export function getMobileApkUrl() {
  return String(import.meta.env.VITE_MOBILE_APK_URL || '').trim();
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
 * @returns {Promise<'apk'|'installed'|'accepted'|'dismissed'|'ios-hint'|'unavailable'|'already'>}
 */
export async function installOrDownloadApp() {
  if (isStandaloneDisplay()) return 'already';

  const apk = getMobileApkUrl();
  if (apk) {
    const link = document.createElement('a');
    link.href = apk;
    link.setAttribute('download', 'anyminutes.apk');
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return 'apk';
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
