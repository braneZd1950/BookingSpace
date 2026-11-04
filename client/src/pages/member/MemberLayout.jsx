import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useGetMeQuery } from '../../api/authApi.js';
import { useGetPublicTenantQuery } from '../../api/tenantApi.js';
import { useListMyMembershipsQuery } from '../../api/membershipApi.js';
import ConsentBanner from '../../components/ConsentBanner.jsx';
import InstallAppBanner from '../../components/InstallAppBanner.jsx';
import PlatformLegalStrip from '../../components/PlatformLegalStrip.jsx';
import { rememberAnalyticsTenant } from '../../components/UsageTracker.jsx';
import { StudioMissingPage } from '../public/StatusPage.jsx';
import { clearSession } from '../../lib/clearSession.js';
import { ONLINE_ENABLED } from '../../lib/studioFeatures.js';
import { buildMemberNavLinks, memberBasePath } from '../../lib/memberNavConfig.js';
import { paletteFromTenant } from './publicSite.js';
import './MemberLayout.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

function strokeIcon(paths, size = 18) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      {paths}
    </svg>
  );
}

const IconHome = () => strokeIcon(
  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-6.2H10.2V21H5a1 1 0 0 1-1-1v-9.5z" />,
);

const IconSlots = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M8 3v3M16 3v3" />
    <rect x="4" y="5.5" width="16" height="14.5" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 10.5h16" />
  </>,
);

const IconPlay = () => strokeIcon(
  <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M8 6.2v11.6L18.5 12 8 6.2z" />,
);

const IconDiscover = () => strokeIcon(
  <>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8z" />
  </>,
);

const IconPrivacy = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M12 3.5 19 6.5v5.2c0 4.2-2.9 7.3-7 8.8-4.1-1.5-7-4.6-7-8.8V6.5L12 3.5z" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.1 11.2 13.8 14.8 10" />
  </>,
);

const IconLogin = () => strokeIcon(
  <>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M10 12h9.5M16.5 8.5 20 12l-3.5 3.5" />
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M13.5 19.5H6.2A2.2 2.2 0 0 1 4 17.3V6.7A2.2 2.2 0 0 1 6.2 4.5h7.3" />
  </>,
);

function PowerIcon() {
  return strokeIcon(
    <>
      <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="M12 3.2v8.2" />
      <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" d="M7.1 6.4a7.2 7.2 0 1 0 9.8 0" />
    </>,
  );
}

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeSession(next) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(next));
}

export default function MemberLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const [session, setSession] = useState(readSession);
  const token = localStorage.getItem(TOKEN_KEY);
  const loggedIn = Boolean(token);
  const { data: meData } = useGetMeQuery(undefined, { skip: !token });

  const { data, isLoading, isError, error } = useGetPublicTenantQuery(slug, {
    skip: !slug,
    refetchOnMountOrArgChange: true,
  });
  const { data: membershipData } = useListMyMembershipsQuery(50, { skip: !loggedIn });
  const tenant = data?.tenant || null;

  const tenantId = tenant ? String(tenant.id) : '';

  useEffect(() => {
    if (tenantId) rememberAnalyticsTenant(tenantId);
  }, [tenantId]);

  useEffect(() => {
    const user = meData?.user;
    if (!token || !user) return;
    const next = {
      name: user.name,
      email: user.email,
      role: user.role,
      detail: session?.detail || '',
    };
    const same = session
      && session.email === next.email
      && session.role === next.role
      && session.name === next.name;
    if (same) return;
    writeSession(next);
    setSession(next);
  }, [token, meData, session]);

  const activeSession = session || (meData?.user ? {
    name: meData.user.name,
    email: meData.user.email,
    role: meData.user.role,
    detail: '',
  } : null);

  const membership = loggedIn
    ? (membershipData?.memberships || []).find((item) => {
      const id = String(item.tenantId || item.tenant?.id || '');
      return id === tenantId && item.status === 'ACTIVE';
    }) || null
    : null;
  const isMember = Boolean(membership);

  async function logout() {
    await clearSession({ dispatch });
    setSession(null);
    navigate('/', { replace: true });
  }

  if (isLoading) {
    return (
      <main className="member-missing">
        <p>Učitavamo studio…</p>
      </main>
    );
  }

  if (isError || !tenant) {
    if (error?.status === 404) {
      return <StudioMissingPage />;
    }
    return (
      <main className="member-missing">
        <h1>Studio trenutno nije dostupan.</h1>
        <p>
          <Link to="/">Natrag na početnu</Link>
          {' · '}
          <Link to="/odrzavanje">Status</Link>
        </p>
      </main>
    );
  }

  const base = memberBasePath(slug);
  const palette = paletteFromTenant(tenant);
  const theme = palette.theme;
  const path = location.pathname.replace(/\/$/, '') || base;
  /* Home + policy pages already ship the full PlatformFooter. */
  const showLegalStrip = path !== base
    && path !== `${base}/privatnost`
    && path !== `${base}/uvjeti`
    && path !== `${base}/kolacici`;

  const memberIcons = {
    home: IconHome,
    slots: IconSlots,
    online: IconPlay,
    discover: IconDiscover,
    privacy: IconPrivacy,
  };
  const navLinks = buildMemberNavLinks(slug, {
    loggedIn,
    onlineEnabled: ONLINE_ENABLED,
  });

  return (
    <div
      className="member-shell"
      style={{
        '--brand': theme.primaryColor,
        '--on-brand': theme.onPrimary,
        '--brand-soft': theme.secondaryColor,
        '--brand-strong': theme.primaryColor,
        background: theme.canvas,
        color: theme.ink,
        fontFamily: theme.fontFamily,
      }}
    >
      <header className="member-nav">
        <Link className="member-nav__brand" to={base} title={tenant.name}>
          <strong>{tenant.name}</strong>
        </Link>
        <nav className="member-nav__tabs" aria-label="Član">
          {navLinks.map((link) => {
            const Icon = memberIcons[link.key];
            return (
              <NavLink
                key={link.key}
                to={link.to}
                end={link.end}
                className="member-nav__item"
                aria-label={link.label}
              >
                {Icon ? <Icon /> : null}
                <span className="member-nav__label">{link.label}</span>
              </NavLink>
            );
          })}
          {loggedIn ? (
            <button
              type="button"
              className="member-nav__item member-nav__power"
              onClick={logout}
              aria-label="Odjava"
              data-tooltip="Odjava"
            >
              <PowerIcon />
            </button>
          ) : (
            <NavLink to="/login" className="member-nav__item" aria-label="Prijava">
              <IconLogin />
              <span className="member-nav__label">Prijava</span>
            </NavLink>
          )}
        </nav>
      </header>
      <Outlet context={{ tenant, membership, isMember, loggedIn, session: activeSession, palette }} />
      {showLegalStrip ? (
        <PlatformLegalStrip
          studioLinks={{
            privacy: `${base}/privatnost`,
            terms: `${base}/uvjeti`,
            cookies: `${base}/kolacici`,
          }}
        />
      ) : null}
      <ConsentBanner />
      <InstallAppBanner />
    </div>
  );
}
