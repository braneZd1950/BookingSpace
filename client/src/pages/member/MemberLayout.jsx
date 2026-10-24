import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useGetPublicTenantQuery } from '../../api/tenantApi.js';
import { useListMyMembershipsQuery } from '../../api/membershipApi.js';
import ConsentBanner from '../../components/ConsentBanner.jsx';
import InstallAppBanner from '../../components/InstallAppBanner.jsx';
import { rememberAnalyticsTenant } from '../../components/UsageTracker.jsx';
import { StudioMissingPage } from '../public/StatusPage.jsx';
import { paletteFromTenant } from './publicSite.js';
import './MemberLayout.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

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

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function MemberLayout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(readSession);
  const token = localStorage.getItem(TOKEN_KEY);
  const loggedIn = Boolean(token && session);

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

  const membership = loggedIn
    ? (membershipData?.memberships || []).find((item) => {
      const id = String(item.tenantId || item.tenant?.id || '');
      return id === tenantId && item.status === 'ACTIVE';
    }) || null
    : null;
  const isMember = Boolean(membership);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
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

  const base = `/s/${slug}`;
  const palette = paletteFromTenant(tenant);
  const theme = palette.theme;

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
        <Link className="member-nav__brand" to={base}>
          <strong>{tenant.name}</strong>
        </Link>
        <nav aria-label="Član">
          <NavLink to={base} end>
            Početna
          </NavLink>
          <NavLink to={`${base}/termini`}>
            Termini
          </NavLink>
          <NavLink to={`${base}/online`}>
            Online
          </NavLink>
          {loggedIn ? (
            <NavLink to={`${base}/privatnost`}>
              Privatnost
            </NavLink>
          ) : null}
          {loggedIn ? (
            <button
              type="button"
              className="member-nav__power"
              onClick={logout}
              aria-label="Odjava"
              data-tooltip="Odjava"
            >
              <PowerIcon />
            </button>
          ) : (
            <NavLink to="/login">Prijava</NavLink>
          )}
        </nav>
      </header>
      <Outlet context={{ tenant, membership, isMember, loggedIn, session, palette }} />
      <ConsentBanner />
      <InstallAppBanner />
    </div>
  );
}
