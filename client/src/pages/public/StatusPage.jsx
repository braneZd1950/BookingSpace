import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contactEmail } from '../../lib/contact.js';
import './StatusPage.scss';

const MAINTENANCE_RETRY_KEY = 'am.maintenance.retry';

export function StatusPage({
  code,
  title,
  lead,
  note,
  hint,
  primaryTo = '/',
  primaryLabel = 'Početna',
  onPrimary,
  secondaryTo,
  secondaryLabel,
  showContact = false,
  contactPrefix = 'Hitno?',
}) {
  return (
    <main className="status">
      <div className="status__panel">
        {code ? <p className="status__code">{code}</p> : null}
        <h1>{title}</h1>
        <p className="status__lead">{lead}</p>
        {note ? <p className="status__note">{note}</p> : null}
        <div className="status__actions">
          {typeof onPrimary === 'function' ? (
            <button type="button" className="status__cta" onClick={onPrimary}>
              {primaryLabel}
            </button>
          ) : (
            <Link className="status__cta" to={primaryTo}>
              {primaryLabel}
            </Link>
          )}
          {secondaryTo && secondaryLabel ? (
            <Link className="status__cta status__cta--ghost" to={secondaryTo}>
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
        {hint ? <p className="status__hint">{hint}</p> : null}
        {showContact ? (
          <p className="status__meta">
            {contactPrefix}
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
  const [hint, setHint] = useState(() => {
    try {
      return sessionStorage.getItem(MAINTENANCE_RETRY_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!hint) return undefined;
    try {
      sessionStorage.removeItem(MAINTENANCE_RETRY_KEY);
    } catch {
      /* ignore */
    }
    return undefined;
  }, [hint]);

  function onRetry() {
    try {
      sessionStorage.setItem(MAINTENANCE_RETRY_KEY, '1');
    } catch {
      setHint(true);
    }
    window.location.reload();
  }

  return (
    <StatusPage
      code="Održavanje"
      title="Kratko smo na pauzi"
      lead="Trenutačno radimo na sustavu, pa je AnyMinutes privremeno nedostupan. Rezervacije i prijave vraćaju se čim završimo. Hvala vam na strpljenju."
      note="Sve vaše rezervacije i podaci ostaju sigurni i čekaju vas na istom mjestu."
      primaryLabel="Pokušajte ponovno"
      onPrimary={onRetry}
      hint={hint ? 'Još uvijek radimo na tome. Pokušajte ponovno za koji trenutak.' : undefined}
      showContact
      contactPrefix="Hitno? Javite nam se na"
    />
  );
}

export function ErrorPage({ onRetry } = {}) {
  return (
    <main className="status">
      <div className="status__panel">
        <p className="status__code">Greška</p>
        <h1>Nešto je pošlo po zlu.</h1>
        <p className="status__lead">
          Stranica se nije učitala kako treba. Pokušajte ponovno — ako se
          problem ponovi, javite nam i nastavit ćemo odmah.
        </p>
        <div className="status__actions">
          {typeof onRetry === 'function' ? (
            <button type="button" className="status__cta" onClick={onRetry}>
              Pokušajte ponovno
            </button>
          ) : (
            <Link className="status__cta" to="/">
              Početna
            </Link>
          )}
          <Link className="status__cta status__cta--ghost" to="/">
            Početna
          </Link>
        </div>
        <p className="status__meta">
          Hitno?
          {' '}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </div>
    </main>
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
            Početna anyminutes
          </Link>
          <Link className="status__cta status__cta--ghost" to="/login">
            Prijava
          </Link>
        </div>
      </div>
    </main>
  );
}
