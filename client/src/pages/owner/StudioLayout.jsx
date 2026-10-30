import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import ConsentBanner from '../../components/ConsentBanner.jsx';
import InstallAppBanner from '../../components/InstallAppBanner.jsx';
import { useMyTenantsQuery } from '../../api/tenantApi.js';
import { rememberAnalyticsTenant } from '../../components/UsageTracker.jsx';
import { findPalette } from '../../styles/studioPalette.js';
import { loadStudio, STUDIO_KEY } from '../../lib/studio.js';
import { studioPublicPath } from '../../lib/studioPublicUrl.js';
import {
  GALLERY_ENABLED,
  LAUNCH_PLAN_ENABLED,
  ONLINE_ENABLED,
  PAYMENTS_UI_ENABLED,
} from '../../lib/studioFeatures.js';
import { studioFromTenant } from './studioSync.js';
import './StudioLayout.scss';

const TOKEN_KEY = 'bookingspace.token';

function strokeIcon(paths) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      {paths}
    </svg>
  );
}

const IconHome = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5z" />
  </>,
);

const IconSlots = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 3v3M16 3v3" />
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 10.5h16" />
  </>,
);

const IconGallery = () => strokeIcon(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="9" cy="10" r="1.6" fill="currentColor" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m7 17 3.2-3.8 2.4 2.8 3.1-3.7L17.5 17" />
  </>,
);

const IconPlay = () => strokeIcon(
  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M8 6.2v11.6L18.5 12 8 6.2z" />,
);

const IconTill = () => strokeIcon(
  <>
    <rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M7 9.2h10M7 12.5h6" />
  </>,
);

const IconCalendar = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 3.5v3M16 3.5v3" />
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 12.2h.01M12 12.2h.01M16 12.2h.01M8 15.8h.01M12 15.8h.01" />
  </>,
);

const IconPeople = () => strokeIcon(
  <>
    <circle cx="9" cy="8.2" r="2.4" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4.2 18.5c.4-2.6 2.4-4 4.8-4s4.4 1.4 4.8 4" />
    <circle cx="16.4" cy="8.8" r="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M15.2 14.6c1.7.3 3 1.4 3.4 3.9" />
  </>,
);

const IconChart = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4.5 19.5h15" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M7 16.5V11M12 16.5V7.5M17 16.5v-3.5" />
  </>,
);

const IconPlan = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M7 4.5h10v15l-2.2-1.4L12.5 20l-2.3-1.9L8 19.5 7 4.5z" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M10 9h4M10 12.5h4" />
  </>,
);

const IconGear = () => strokeIcon(
  <>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 3.5v2.2M12 18.3v2.2M4.8 7.2l1.9 1.1M17.3 15.7l1.9 1.1M4.8 16.8l1.9-1.1M17.3 8.3l1.9-1.1" />
  </>,
);

const IconSetup = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v12M8.5 12.5 12 16l3.5-3.5" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M5 19.5h14" />
  </>,
);

const IconPower = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="M12 3.2v8.2" />
    <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="M7.1 6.4a7.2 7.2 0 1 0 9.8 0" />
  </>,
);

const allLinks = [
  { to: '/stranica', label: 'Početna', end: true, Icon: IconHome },
  { to: '/stranica/termini', label: 'Termini', Icon: IconSlots },
  { to: '/stranica/galerija', label: 'Galerija', Icon: IconGallery, flag: 'gallery' },
  { to: '/stranica/online', label: 'Online', Icon: IconPlay, flag: 'online' },
  { to: '/stranica/placanja', label: 'Blagajna', Icon: IconTill, flag: 'payments' },
  { to: '/stranica/kalendar', label: 'Kalendar', Icon: IconCalendar },
  { to: '/stranica/clanovi', label: 'Članovi', Icon: IconPeople },
  { to: '/stranica/analitika', label: 'Analitika', Icon: IconChart },
  { to: '/stranica/plan', label: 'Plan', Icon: IconPlan, flag: 'plan' },
  { to: '/stranica/postavke', label: 'Postavke', Icon: IconGear },
];

const featureOn = {
  gallery: GALLERY_ENABLED,
  online: ONLINE_ENABLED,
  payments: PAYMENTS_UI_ENABLED,
  plan: LAUNCH_PLAN_ENABLED,
};

const links = allLinks.filter((item) => !item.flag || featureOn[item.flag]);

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
      && JSON.stringify(current.sections) === JSON.stringify(next.sections)
      && JSON.stringify(current.siteSettings?.gallery || [])
        === JSON.stringify(next.siteSettings?.gallery || []);
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
        '--site-ink': palette.theme.ink,
        '--site-radius': palette.theme.borderRadius,
        background: palette.theme.canvas,
        color: palette.theme.ink,
        fontFamily: palette.theme.fontFamily,
      }}
    >
      <header className="studio-nav">
        <Link className="studio-nav__brand" to="/stranica" title={studio.name}>
          <strong>{studio.name}</strong>
        </Link>
        <nav aria-label="Studio">
          {links.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="studio-nav__item"
              aria-label={label}
              data-tooltip={label}
            >
              <Icon />
            </NavLink>
          ))}
          {!studio.guideDone ? (
            <NavLink
              to="/postavljanje"
              className="studio-nav__item"
              aria-label="Postavljanje"
              data-tooltip="Postavljanje"
            >
              <IconSetup />
            </NavLink>
          ) : null}
          <button
            type="button"
            className="studio-nav__item studio-nav__power"
            onClick={logout}
            aria-label="Odjava"
            data-tooltip="Odjava"
          >
            <IconPower />
          </button>
        </nav>
      </header>
      {!studio.guideDone ? (
        <p className="studio-host-bar">
          Vaša stranica bit će <strong>{studioPublicPath(studio.slug)}</strong> — dovršite vodič.
        </p>
      ) : null}
      <Outlet context={{ studio, palette }} />
      <ConsentBanner />
      <InstallAppBanner />
    </div>
  );
}
