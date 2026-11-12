import { Link } from 'react-router-dom';
import {
  getMobileWebOpenUrl,
  isExternalAppUrl,
} from '../../lib/mobileAppUrl.js';
import './MobileAppPage.scss';

/**
 * Web-only preuzimanje mobilne app (bez storeova).
 */
export default function MobileAppPage() {
  const openUrl = getMobileWebOpenUrl();
  const external = isExternalAppUrl(openUrl);

  return (
    <main className="mobile-app">
      <div className="mobile-app__shell">
        <p className="mobile-app__brand">anyminutes</p>
        <h1>Mobilna aplikacija</h1>
        <p className="mobile-app__lead">
          Trenutno se otvara putem weba — bez Google Playa i App Storea.
          Isti račun kao na stranici, na telefonu u pregledniku.
        </p>

        {openUrl ? (
          <a
            className="mobile-app__cta"
            href={openUrl}
            {...(external
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            Otvorite mobilnu aplikaciju
          </a>
        ) : (
          <p className="mobile-app__note">
            Mobilni web host još nije povezan na ovom okruženju. Lokalno pokrenite
            Expo web (`npm run web` u <code>mobile/</code>), a u produkciji
            postavite <code>VITE_MOBILE_WEB_URL</code>.
          </p>
        )}

        <ul className="mobile-app__steps">
          <li>Otvorite poveznicu na telefonu (Chrome / Safari).</li>
          <li>Prijavite se istim e-mailom kao na webu.</li>
          <li>Po želji dodajte stranicu na početni zaslon (PWA).</li>
        </ul>

        <p className="mobile-app__back">
          <Link to="/">← Natrag na početnu</Link>
        </p>
      </div>
    </main>
  );
}
