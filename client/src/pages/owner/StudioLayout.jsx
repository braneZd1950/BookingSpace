import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import ConsentBanner from '../../components/ConsentBanner.jsx';
import InstallAppBanner from '../../components/InstallAppBanner.jsx';
import { useMyTenantsQuery } from '../../api/tenantApi.js';
import { rememberAnalyticsTenant } from '../../components/UsageTracker.jsx';
import { findPalette } from '../../styles/studioPalette.js';
import { loadStudio, STUDIO_KEY } from '../../studio.js';
import { studioHost } from './siteTemplates.js';
import { studioFromTenant } from './studioSync.js';
import './StudioLayout.scss';

const TOKEN_KEY = 'bookingspace.token';

const links = [
  ['/stranica', 'Početna', true],
  ['/stranica/termini', 'Termini', false],
  ['/stranica/kalendar', 'Kalendar', false],
  ['/stranica/clanovi', 'Članovi', false],
  ['/stranica/analitika', 'Analitika', false],
  ['/stranica/postavke', 'Postavke', false],
];

function PowerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M12 3.2v8.2"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        d="M7.1 6.4a7.2 7.2 0 1 0 9.8 0"
      />
    </svg>
  );
}

export default function StudioLayout() {
  const navigate = useNavigate();
  const [studio, setStudio] = useState(() => loadStudio());
  const token = localStorage.getItem(TOKEN_KEY);
  const { data: mine } = useMyTenantsQuery(undefined, { skip: !token });

  useEffect(() => {
    function refresh() {
      setStudio(loadStudio());
    }
    window.addEventListener('studio-changed', refresh);
    return () => window.removeEventListener('studio-changed', refresh);
  }, []);

  useEffect(() => {
    if (studio?.id) rememberAnalyticsTenant(studio.id);
  }, [studio?.id]);

  useEffect(() => {
    const owned = mine?.tenants?.find((item) => item.role === 'BUSINESS_OWNER')
      || mine?.tenants?.[0];
    if (!owned?.tenant) return;
    const next = studioFromTenant(owned.tenant, loadStudio() || {});
    const current = loadStudio();
    const same = current
      && current.id === next.id
      && current.name === next.name
      && current.description === next.description
      && current.palette === next.palette
      && current.layout === next.layout
      && current.heroImageUrl === next.heroImageUrl
      && current.guideDone === next.guideDone
      && JSON.stringify(current.hours) === JSON.stringify(next.hours)
      && JSON.stringify(current.sections) === JSON.stringify(next.sections);
    if (same) return;
    localStorage.setItem(STUDIO_KEY, JSON.stringify(next));
    setStudio(next);
  }, [mine]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STUDIO_KEY);
    window.dispatchEvent(new Event('studio-changed'));
    navigate('/', { replace: true });
  }

  if (!studio?.name) {
    return (
      <main className="studio-missing">
        <h1>Studio još nije otvoren.</h1>
        <p>Registrirajte se ili se prijavite.</p>
        <Link to="/login">Prijava</Link>
        {' · '}
        <Link to="/register">Registracija</Link>
      </main>
    );
  }

  const palette = findPalette(studio.palette);

  return (
    <div
      className="studio-shell"
      style={{
        '--site-brand': palette.theme.primaryColor,
        '--site-on': palette.theme.onPrimary,
        '--site-soft': palette.theme.secondaryColor,
        '--site-radius': palette.theme.borderRadius,
        background: palette.theme.canvas,
        color: palette.theme.ink,
        fontFamily: palette.theme.fontFamily,
      }}
    >
      <header className="studio-nav">
        <Link className="studio-nav__brand" to="/stranica">
          <strong>{studio.name}</strong>
        </Link>
        <nav aria-label="Studio">
          {links.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>
              {label}
            </NavLink>
          ))}
          {!studio.guideDone ? (
            <NavLink to="/postavljanje">Postavljanje</NavLink>
          ) : null}
          <button
            type="button"
            className="studio-nav__power"
            onClick={logout}
            aria-label="Odjava"
            data-tooltip="Odjava"
          >
            <PowerIcon />
          </button>
        </nav>
      </header>
      {!studio.guideDone ? (
        <p className="studio-host-bar">
          Vaša adresa bit će <strong>{studioHost(studio.slug)}</strong> — dovršite vodič.
        </p>
      ) : null}
      <Outlet context={{ studio, palette }} />
      <ConsentBanner />
      <InstallAppBanner />
    </div>
  );
}
