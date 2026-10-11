import { contactEmail } from '../../contact.js';
import InfoPage from './InfoPage.jsx';

export function PrivacyPage() {
  return (
    <InfoPage title="Privatnost">
      <p>
        BookingApp čuva ono što treba da termin postoji: ime, e-poštu, termin
        i, kad ga ima, članstvo. Lozinka se ne sprema kao čitljiv tekst.
      </p>
      <p>
        Podatke jednog studija ne pokazujemo drugom. Ne prodajemo popise ljudi.
      </p>
    </InfoPage>
  );
}

export function TermsPage() {
  return (
    <InfoPage title="Uvjeti korištenja">
      <p>
        Račun je vaš. Termine uređujete vi ili vaš klijent, unutar pravila koja
        studio postavi.
      </p>
      <p>Ne dirajte tuđi studio i tuđi termin.</p>
    </InfoPage>
  );
}

export function CookiesPage() {
  return (
    <InfoPage title="Kolačići">
      <p>Ova stranica ne postavlja marketinške kolačiće.</p>
      <p>
        Kad prijava krene, preglednik će pamtiti da ste prijavljeni. To je sve
        što treba da ostanete u svom danu.
      </p>
    </InfoPage>
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
        Za sam BookingApp pišite na{' '}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </InfoPage>
  );
}
