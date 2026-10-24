import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import ConsentBanner from '@client/components/ConsentBanner.jsx';
import InstallAppBanner from '@client/components/InstallAppBanner.jsx';
import { useMyTenantsQuery } from '@client/api/tenantApi.js';
import { rememberAnalyticsTenant } from '@client/components/UsageTracker.jsx';
import { findPalette } from '@client/styles/studioPalette.js';
import { loadStudio, STUDIO_KEY } from '@client/studio.js';
import { studioPublicPath } from '@client/studioPublicUrl.js';
import { studioFromTenant } from '@client/pages/owner/studioSync.js';
import { IconCalendar, IconGear, IconHome, IconPeople, IconPlay } from './icons.jsx';

const TOKEN_KEY = 'bookingspace.token';

function IconSlots() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M4 5.5h7v13H4.8A.8.8 0 0 1 4 17.7V5.5zm9 0h7v12.2a.8.8 0 0 1-.8.8H13V5.5z" />
    </svg>
  );
}

const tabs = [
  ['/stranica', 'Početna', IconHome, true],
  ['/stranica/termini', 'Termini', IconSlots, false],
  ['/stranica/online', 'Online', IconPlay, false],
  ['/stranica/kalendar', 'Kalendar', IconCalendar, false],
  ['/stranica/clanovi', 'Članovi', IconPeople, false],
  ['/stranica/postavke', 'Više', IconGear, false],
];

export default function MobileStudioLayout() {
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
      && current.palette === next.palette
      && current.guideDone === next.guideDone;
    if (same) return;
    localStorage.setItem(STUDIO_KEY, JSON.stringify(next));
    setStudio(next);
  }, [mine]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STUDIO_KEY);
    window.dispatchEvent(new Event('studio-changed'));
    navigate('/login', { replace: true });
  }

  if (!studio?.name) {
    return (
      <main className="m-missing">
        <h1>Studio još nije otvoren.</h1>
        <p>
          <Link to="/login">Prijava</Link>
          {' · '}
          <Link to="/register">Registracija</Link>
        </p>
      </main>
    );
  }

  const palette = findPalette(studio.palette);

  return (
    <div
      className="m-shell"
      style={{
        '--m-brand': palette.theme.primaryColor,
        '--m-on': palette.theme.onPrimary,
        background: palette.theme.canvas,
        color: palette.theme.ink,
        fontFamily: palette.theme.fontFamily,
      }}
    >
      <header className="m-top">
        <Link className="m-top__brand" to="/stranica">{studio.name}</Link>
        <button type="button" className="m-top__action" onClick={logout}>
          Odjava
        </button>
      </header>
      {!studio.guideDone ? (
        <p className="m-missing" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Dovršite postavljanje · {studioPublicPath(studio.slug)}
          {' · '}
          <Link to="/postavljanje">Vodič</Link>
        </p>
      ) : null}
      <div className="m-main">
        <Outlet context={{ studio, palette }} />
      </div>
      <nav className="m-tabs" aria-label="Studio">
        {tabs.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <ConsentBanner />
      <InstallAppBanner />
    </div>
  );
}
