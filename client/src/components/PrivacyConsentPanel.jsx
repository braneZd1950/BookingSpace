import { Link } from 'react-router-dom';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent.js';
import './PrivacyConsentPanel.scss';

export default function PrivacyConsentPanel({ compact = false }) {
  const { accepted, accept, withdraw, consent, version } = usePrivacyConsent();

  return (
    <article className={compact ? 'privacy-consent is-compact' : 'privacy-consent'}>
      <h2>Privola za obradu podataka</h2>
      <p>
        Za rezervacije i članstvo potrebna je privola usklađena s GDPR-om i
        pravilima platforme (verzija
        {' '}
        {version}
        ). Bez nje možete samo pregledavati sadržaj.
      </p>

      <div className={`privacy-consent__status${accepted ? ' is-on' : ''}`}>
        <strong>{accepted ? 'Privola je dana' : 'Privola nije aktivna'}</strong>
        <span>
          {accepted
            ? `Verzija ${consent?.version || version}${consent?.acceptedAt ? ` · od ${new Date(consent.acceptedAt).toLocaleString('hr-HR')}` : ''}`
            : 'Banner će se ponovno prikazati dok ne prihvatite pravila.'}
        </span>
      </div>

      <div className="privacy-consent__actions">
        {accepted ? (
          <button type="button" className="privacy-consent__withdraw" onClick={() => withdraw('settings')}>
            Povucite privolu
          </button>
        ) : (
          <button type="button" className="privacy-consent__accept" onClick={() => accept('settings')}>
            Prihvatite privolu
          </button>
        )}
        <Link to="/privatnost">Privatnost</Link>
        <Link to="/uvjeti">Uvjeti</Link>
        <Link to="/kolacici">Kolačići</Link>
      </div>
    </article>
  );
}
