import { useEffect, useState } from 'react';
import {
  armAppInstallListener,
  getMobileApkUrl,
  installOrDownloadApp,
  isStandaloneDisplay,
} from '../lib/appInstall.js';

/**
 * „Preuzmite aplikaciju” — APK install na Androidu ili PWA (bez storeova).
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
      if (result === 'apk-android') {
        setHint(
          'Ako se ne otvori dijalog „Instaliraj”, u Postavkama dopustite instalaciju iz Chromea (Nepoznati izvori), pa ponovno pritisnite gumb.',
        );
      } else if (result === 'apk-desktop') {
        setHint(
          'APK se instalira na Android telefonu, ne na računalu. APK izgleda kao ZIP — nemojte ga extraktati. Otvorite ovu stranicu na telefonu ili skenirajte QR s Expo builda.',
        );
      } else if (result === 'expo-link') {
        setHint(
          'Na telefonu otvorite Expo stranicu i pritisnite Install. Nemojte na računalu skidati/extractati ZIP.',
        );
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
            ? 'Preuzimanje nije uspjelo. Pokušajte ponovno na Android Chromeu.'
            : 'Otvorite stranicu u Chromeu na Androidu da instalirate aplikaciju.',
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
