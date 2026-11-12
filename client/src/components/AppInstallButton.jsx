import { useEffect, useState } from 'react';
import {
  armAppInstallListener,
  getMobileApkUrl,
  installOrDownloadApp,
  isStandaloneDisplay,
} from '../lib/appInstall.js';

/**
 * „Preuzmite aplikaciju” — APK download ili PWA install na uređaj (bez storeova).
 */
export default function AppInstallButton({
  className = '',
  label = 'Preuzmite aplikaciju',
}) {
const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const already = isStandaloneDisplay();

  useEffect(() => {
    const stop = armAppInstallListener();
    return stop;
  }, []);

  if (already) {
    return (
      <p className="home__note" role="status">
        Aplikacija je već na ovom uređaju.
      </p>
    );
  }

  async function onInstall() {
    setBusy(true);
    setHint('');
    try {
      const result = await installOrDownloadApp();
      if (result === 'apk') {
        setHint('Preuzimanje je pokrenuto. Otvorite datoteku i potvrdite instalaciju.');
      } else if (result === 'accepted' || result === 'installed') {
        setHint('Aplikacija je dodana na uređaj.');
      } else if (result === 'ios-hint') {
        setHint('Na iPhoneu: Podijeli → „Dodaj na početni zaslon”.');
      } else if (result === 'dismissed') {
        setHint('');
      } else if (result === 'already') {
        setHint('Aplikacija je već na ovom uređaju.');
      } else {
        setHint(
          getMobileApkUrl()
            ? 'Preuzimanje nije uspjelo. Pokušajte ponovno.'
            : 'Otvorite stranicu u Chromeu na Androidu da instalirate aplikaciju na početni zaslon.',
        );
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="home__app-install">
      <button
        type="button"
        className={className}
        onClick={() => {
          void onInstall();
        }}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? 'Pripremamo…' : label}
      </button>
      {hint ? (
        <p className="home__note" role="status">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
