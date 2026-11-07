import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ConsentBanner from '../../components/ConsentBanner.jsx';
import PlatformLegalStrip from '../../components/PlatformLegalStrip.jsx';
import { useGetMeQuery } from '../../api/authApi.js';
import { useListMyMembershipsQuery } from '../../api/membershipApi.js';
import { useMyTenantsQuery } from '../../api/tenantApi.js';
import { rememberAnalyticsTenant } from '../../components/UsageTracker.jsx';
import useResolvedDarkMode from '../../hooks/useResolvedDarkMode.js';
import { findPalette } from '../../styles/studioPalette.js';
import { clearSession } from '../../lib/clearSession.js';
import { resolvePostLoginPath } from '../../lib/resolvePostLoginPath.js';
import { loadStudio, STUDIO_KEY } from '../../lib/studio.js';
import { studioPublicPath } from '../../lib/studioPublicUrl.js';
import {
  GALLERY_ENABLED,
  LAUNCH_PLAN_ENABLED,
  ONLINE_ENABLED,
  PAYMENTS_UI_ENABLED,
} from '../../lib/studioFeatures.js';
import { filterStudioNavLinks, STUDIO_NAV_ALL } from '../../lib/studioNavConfig.js';
import { paletteSurfaceVars } from '../../lib/uiTheme.js';
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

const ICONS = {
  home: IconHome,
  slots: IconSlots,
  gallery: IconGallery,
  online: IconPlay,
  payments: IconTill,
  calendar: IconCalendar,
  members: IconPeople,
  analytics: IconChart,
  plan: IconPlan,
  settings: IconGear,
};

const featureOn = {
  gallery: GALLERY_ENABLED,
  online: ONLINE_ENABLED,
  payments: PAYMENTS_UI_ENABLED,
  plan: LAUNCH_PLAN_ENABLED,
};

const links = filterStudioNavLinks(STUDIO_NAV_ALL, featureOn).map((item) => ({
  ...item,
  Icon: ICONS[item.key],
}));

export default function StudioLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const darkMode = useResolvedDarkMode();
  const [studio, setStudio] = useState(() => loadStudio());
  const token = localStorage.getItem(TOKEN_KEY);
  const { data: meData, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const { data: mine, isLoading: mineLoading } = useMyTenantsQuery(undefined, { skip: !token });
  const { data: membershipsData } = useListMyMembershipsQuery(50, { skip: !token });
  /* Početna already renders SiteFrame with the full PlatformFooter. */
  const showLegalStrip = location.pathname !== '/stranica'
    && location.pathname !== '/stranica/';

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
    // Never fall back to CUSTOMER tenant — that opened the owner shell for members.
    const owned = mine?.tenants?.find((item) => item.role === 'BUSINESS_OWNER')
      || mine?.tenants?.find((item) => item.role === 'STAFF');
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

  useEffect(() => {
    if (!token) {
      localStorage.removeItem(STUDIO_KEY);
      window.dispatchEvent(new Event('studio-changed'));
      navigate('/login', { replace: true });
      return;
    }
    if (meLoading || mineLoading || !meData?.user || !mine) return;
    const user = {
      ...meData.user,
      platformAdmin: meData.platformAdmin,
    };
    const isOwner = user.role === 'BUSINESS_OWNER'
      || user.platformAdmin
      || user.role === 'ADMIN'
      || user.role === 'PLATFORM_STAFF';
    const hasStudioLink = (mine.tenants || []).some(
      (row) => row.role === 'BUSINESS_OWNER' || row.role === 'STAFF',
    );
    if (isOwner || hasStudioLink) return;
    const memberships = Array.isArray(membershipsData)
      ? membershipsData
      : membershipsData?.memberships || [];
    const dest = resolvePostLoginPath(user, {
      memberships,
      tenants: mine.tenants || [],
    });
    if (dest && dest !== '/stranica' && !dest.startsWith('/stranica/')) {
      localStorage.removeItem(STUDIO_KEY);
      navigate(dest, { replace: true });
    }
  }, [token, meLoading, mineLoading, meData, mine, membershipsData, navigate]);

  async function logout() {
    await clearSession({ dispatch });
    navigate('/', { replace: true });
  }

  if (!token) {
    return (
      <main className="studio-missing">
        <h1>Prijava je potrebna</h1>
        <p>Vlasnički studio zahtijeva prijavljeni račun.</p>
        <Link to="/login">Prijava</Link>
      </main>
    );
  }

  if (token && (meLoading || mineLoading)) {
    return (
      <main className="studio-missing">
        <p>Učitavamo studio…</p>
      </main>
    );
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
  const surfaceVars = paletteSurfaceVars(palette.theme, { dark: darkMode });

  return (
    <div
      className="studio-shell"
      style={surfaceVars}
    >
      <header className="studio-topbar">
        <Link className="studio-nav__brand" to="/stranica" title={studio.name}>
          <strong>{studio.name}</strong>
        </Link>
        <nav className="studio-nav__tabs" aria-label="Studio">
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
      {showLegalStrip ? (
        <PlatformLegalStrip
          studioLinks={{
            privacy: `/s/${studio.slug}/privatnost`,
            terms: `/s/${studio.slug}/uvjeti`,
            cookies: `/s/${studio.slug}/kolacici`,
          }}
        />
      ) : null}
      <ConsentBanner />
    </div>
  );
}
