import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BrandWordmark from '../../components/BrandWordmark.jsx';
import { SeoNoIndex } from '../../components/SeoHead.jsx';
import { BRAND } from '../../lib/brand.js';
import { contactEmail } from '../../lib/contact.js';
import './StatusPage.scss';

const MAINTENANCE_RETRY_KEY = 'am.maintenance.retry';

function StatusShell({ variant = 'base', children }) {
  return (
    <main className={`status${variant === 'miss' ? ' status--miss' : ''}`}>
      <div className="status__atmosphere" aria-hidden="true">
        <span className="status__wash" />
        <span className="status__grain" />
      </div>
      {children}
    </main>
  );
}

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
  showBrand = true,
}) {
  return (
    <StatusShell>
      <div className="status__panel">
        {showBrand ? (
          <Link className="status__brand" to="/" aria-label={BRAND.name}>
            <BrandWordmark slot="banner" tone="dark" decorative />
          </Link>
        ) : null}
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
    </StatusShell>
  );
}

export function NotFoundPage() {
  return (
    <StatusShell variant="miss">
      <SeoNoIndex title="Stranica nije pronađena — Blizari" />
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
          <Link className="status__brand" to="/" aria-label={BRAND.name}>
            <BrandWordmark slot="banner" tone="dark" decorative />
          </Link>
          <p className="status__code">Stranica nije pronađena</p>
          <h1>Ovaj sat nije u rasporedu.</h1>
          <p className="status__lead">
            Ova adresa nije dio Blizarija — nema studija ni termina ovdje.
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
    </StatusShell>
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
      lead="Trenutačno radimo na sustavu, pa je Blizari privremeno nedostupan. Rezervacije i prijave vraćaju se čim završimo. Hvala vam na strpljenju."
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
    <StatusPage
      code="Greška"
      title="Nešto je pošlo po zlu."
      lead="Stranica se nije učitala kako treba. Pokušajte ponovno — ako se problem ponovi, javite nam na Blizariju i nastavit ćemo odmah."
      primaryLabel="Pokušajte ponovno"
      onPrimary={typeof onRetry === 'function' ? onRetry : undefined}
      primaryTo="/"
      secondaryTo="/"
      secondaryLabel="Početna"
      showContact
      contactPrefix="Hitno?"
    />
  );
}

export function StudioMissingPage() {
  return (
    <StatusPage
      code="Studio nije dostupan"
      title="Na ovoj adresi nema aktivnog objekta."
      lead="Provjerite poveznicu od svog poslovanja. Ako ste član, prijavite se — nakon prijave otvara se stranica objekta kod kojeg imate članarinu."
      primaryTo="/"
      primaryLabel={`Početna ${BRAND.name}`}
      secondaryTo="/login"
      secondaryLabel="Prijava"
    />
  );
}
