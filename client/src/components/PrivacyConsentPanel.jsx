import { BLIZARI_LEGAL } from '../../../shared/memberAccountSettings.js';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent.js';
import './PrivacyConsentPanel.scss';

export default function PrivacyConsentPanel({ compact = false }) {
  const { accepted, accept, withdraw, consent, version } = usePrivacyConsent();

  return (
    <article className={compact ? 'privacy-consent is-compact' : 'privacy-consent'}>
      <h2>Privola za obradu podataka</h2>
      <p>
        Ovo je privola potrebna za rezervacije i članstvo (verzija
        {' '}
        {version}
        ). Nije ista kao marketinška privola — povlačenje novosti ne blokira
        osnovne rezervacije, ali povlačenje ove privole može ograničiti rezervacije.
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
        <a href={BLIZARI_LEGAL.privacy} target="_blank" rel="noreferrer">
          Obavijest o privatnosti
        </a>
      </div>
    </article>
  );
}
