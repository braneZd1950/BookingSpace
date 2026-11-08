import { contactEmail } from '../../lib/contact.js';
import { legalEntity } from '../../lib/legal.js';
import {
  cookiesSections,
  privacySections,
  termsSections,
} from '../../../../shared/platformLegal/sections.js';
import InfoPage from './InfoPage.jsx';
import LegalPage from './LegalPage.jsx';

export function PrivacyPage() {
  return (
    <LegalPage
      docId="privatnost"
      title="Politika privatnosti"
      lead="Jednostavno: što radimo s vašim podacima, zašto, koliko dugo — i kako ostvarujete svoja prava."
      basis="GDPR (Uredba EU 2016/679) · Zakon o provedbi Opće uredbe o zaštiti podataka (RH) · propisi Republike Hrvatske"
      sections={privacySections(legalEntity)}
    />
  );
}

export function TermsPage() {
  return (
    <LegalPage
      docId="uvjeti"
      title="Uvjeti korištenja"
      lead="Pravila igre: što smijete očekivati od aplikacije, što od studija — i što očekujemo od vas."
      basis="Zakon o obveznim odnosima · Zakon o elektroničkoj trgovini · Zakon o zaštiti potrošača (kad se primjenjuje) · GDPR · pravo RH i EU"
      sections={termsSections(legalEntity)}
    />
  );
}

export function CookiesPage() {
  return (
    <LegalPage
      docId="kolacici"
      title="Politika kolačića"
      lead="Što preglednik pamti kod nas — uglavnom da ostanete prijavljeni, bez marketinških tragova."
      basis="Zakon o elektroničkim komunikacijama · GDPR · praksa ePrivacy"
      sections={cookiesSections(legalEntity)}
    />
  );
}

export function FeedbackPage() {
  return (
    <InfoPage title="Povratna informacija">
      <p>
        Ako nešto zapne, ili vam u danu fali nešto što biste stvarno koristili,
        dovoljna je jedna rečenica.
      </p>
      <p>
        Pošaljite je na <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </InfoPage>
  );
}

export function ContactPage() {
  return (
    <InfoPage title="Kontakt">
      <p>Za svoj termin javite se studiju kod kojeg ste upisani.</p>
      <p>
        Za sam anyminutes pišite na{' '}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </InfoPage>
  );
}
