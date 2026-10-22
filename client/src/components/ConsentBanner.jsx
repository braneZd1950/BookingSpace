import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent.js';
import './ConsentBanner.scss';

const DISMISS_KEY = 'bookingspace.consentBannerDismissed';

function readDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export default function ConsentBanner() {
  const { accepted, accept } = usePrivacyConsent();
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    if (accepted) {
      try {
        sessionStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
      setDismissed(false);
    }
  }, [accepted]);

  if (accepted) return null;

  function browseOnly() {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  if (dismissed) {
    return (
      <button
        type="button"
        className="consent-chip"
        onClick={() => setDismissed(false)}
      >
        Privola za rezervacije
      </button>
    );
  }

  return (
    <div className="consent-banner" role="dialog" aria-labelledby="consent-banner-title">
      <div className="consent-banner__inner">
        <div className="consent-banner__copy">
          <p className="consent-banner__brand">anyminutes</p>
          <h2 id="consent-banner-title">Privola za korištenje podataka</h2>
          <p>
            Sadržaj možete pregledavati bez privole. Za rezervacije, članstvo i
            radnje koje obrađuju vaše podatke trebate prihvatiti
            {' '}
            <Link to="/privatnost">Privatnost</Link>
            {' '}
            i
            {' '}
            <Link to="/uvjeti">Uvjete</Link>
            .
            Privolu možete povući u postavkama — tada se ovaj prozor ponovno pojavi.
          </p>
        </div>
        <div className="consent-banner__actions">
          <button type="button" className="consent-banner__accept" onClick={() => accept('banner')}>
            Prihvaćam
          </button>
          <button type="button" className="consent-banner__browse" onClick={browseOnly}>
            Samo pregledavam
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConsentGate({ title = 'Potrebna je privola', children }) {
  const { accepted, accept } = usePrivacyConsent();
  if (accepted) return children || null;

  return (
    <aside className="consent-gate" aria-label={title}>
      <h2>{title}</h2>
      <p>
        Bez privole možete pregledavati sadržaj, ali ne možete rezervirati ni
        mijenjati termine. Prihvatite pravila da nastavite.
      </p>
      <div className="consent-gate__actions">
        <button type="button" onClick={() => accept('banner')}>
          Prihvaćam privolu
        </button>
        <Link to="/privatnost">Pročitajte privatnost</Link>
      </div>
    </aside>
  );
}
