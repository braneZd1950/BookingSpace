import { useEffect, useState } from 'react';
import './InstallAppBanner.scss';

const DISMISS_KEY = 'anyminutes.installDismissed';

function isStandalone() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function InstallAppBanner() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return undefined;
    } catch {
      /* ignore */
    }

    function onPrompt(event) {
      event.preventDefault();
      setDeferred(event);
      setVisible(true);
      setIosHint(false);
    }

    window.addEventListener('beforeinstallprompt', onPrompt);

    if (isIos()) {
      setIosHint(true);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    setDeferred(null);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* ignore */
    }
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="install-app" role="dialog" aria-label="Instalacija aplikacije">
      <div className="install-app__card">
        <img className="install-app__icon" src="/icons/icon-192.png" alt="" width="48" height="48" />
        <div className="install-app__copy">
          <strong>anyminutes na početni zaslon</strong>
          {iosHint && !deferred ? (
            <p>
              Na iPhoneu otvorite Safari → Podijeli → „Dodaj na početni zaslon”.
            </p>
          ) : (
            <p>Instalirajte kao običnu aplikaciju — ikona na početnom zaslonu, bez trake preglednika.</p>
          )}
        </div>
        <div className="install-app__actions">
          {deferred ? (
            <button type="button" className="install-app__primary" onClick={install}>
              Instaliraj
            </button>
          ) : null}
          <button type="button" className="install-app__ghost" onClick={dismiss}>
            Kasnije
          </button>
        </div>
      </div>
    </div>
  );
}
