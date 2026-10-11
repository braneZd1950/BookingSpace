import { Link } from 'react-router-dom';
import { contactEmail } from '../../contact.js';
import './StatusPage.scss';

export function StatusPage({
  code,
  title,
  lead,
  primaryTo = '/',
  primaryLabel = 'Početna',
  secondaryTo,
  secondaryLabel,
  showContact = false,
}) {
  return (
    <main className="status">
      <div className="status__panel">
        {code ? <p className="status__code">{code}</p> : null}
        <h1>{title}</h1>
        <p className="status__lead">{lead}</p>
        <div className="status__actions">
          <Link className="status__cta" to={primaryTo}>
            {primaryLabel}
          </Link>
          {secondaryTo && secondaryLabel ? (
            <Link className="status__cta status__cta--ghost" to={secondaryTo}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
        {showContact ? (
          <p className="status__meta">
            Hitno?
            {' '}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        ) : null}
      </div>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main className="status status--miss">
      <div className="status__miss">
        <aside className="status__slot" aria-hidden="true">
          <p className="status__slot-day">Danas</p>
          <ul className="status__slot-list">
            <li>
              <span>08:00</span>
              <em>Zauzeto</em>
            </li>
            <li className="is-gap">
              <span>09:00</span>
              <em>Slobodno — ali ova adresa nije termin</em>
            </li>
            <li>
              <span>10:00</span>
              <em>Zauzeto</em>
            </li>
          </ul>
        </aside>

        <div className="status__panel">
          <p className="status__code">Termin ne postoji</p>
          <h1>Ovaj sat nije u rasporedu.</h1>
          <p className="status__lead">
            Ova stranica nije dio rasporeda — nema studija ni termina ovdje.
            Vratite se na početnu ili se prijavite.
          </p>
          <div className="status__actions">
            <Link className="status__cta" to="/">
              Početna
            </Link>
            <Link className="status__cta status__cta--ghost" to="/login">
              Prijava
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export function MaintenancePage() {
  return (
    <StatusPage
      code="Održavanje"
      title="Trenutačno radimo na sustavu."
      lead="BookingApp je privremeno nedostupan. Rezervacije i prijave vratit će se čim završimo. Hvala na strpljenju."
      primaryTo="/"
      primaryLabel="Pokušajte ponovno"
      showContact
    />
  );
}

export function StudioMissingPage() {
  return (
    <main className="status status--miss">
      <div className="status__panel">
        <p className="status__code">Studio nije u kalendaru</p>
        <h1>Na ovoj adresi nema aktivnog objekta.</h1>
        <p className="status__lead">
          Provjerite poveznicu od svog fitness studija. Ako ste član, prijavite
          se — nakon prijave otvara se stranica objekta kod kojeg imate članarinu.
        </p>
        <div className="status__actions">
          <Link className="status__cta" to="/">
            Početna BookingApp
          </Link>
          <Link className="status__cta status__cta--ghost" to="/login">
            Prijava
          </Link>
        </div>
      </div>
    </main>
  );
}
