import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useGetPublicTenantQuery } from '@client/api/tenantApi.js';
import { useListMyMembershipsQuery } from '@client/api/membershipApi.js';
import ConsentBanner from '@client/components/ConsentBanner.jsx';
import InstallAppBanner from '@client/components/InstallAppBanner.jsx';
import { rememberAnalyticsTenant } from '@client/components/UsageTracker.jsx';
import { StudioMissingPage } from '@client/pages/public/StatusPage.jsx';
import { paletteFromTenant } from '@client/pages/member/publicSite.js';
import { IconBook, IconHome, IconLock, IconPlay } from './icons.jsx';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

export default function MobileMemberLayout() {
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
  const base = `/s/${slug}`;

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    navigate(base, { replace: true });
  }

  if (isLoading) {
    return (
      <main className="m-missing">
        <p>Učitavamo studio…</p>
      </main>
    );
  }

  if (isError || !tenant) {
    if (error?.status === 404) return <StudioMissingPage />;
    return (
      <main className="m-missing">
        <h1>Studio trenutno nije dostupan.</h1>
        <p><Link to="/">Natrag</Link></p>
      </main>
    );
  }

  const palette = paletteFromTenant(tenant);
  const theme = palette.theme;

  return (
    <div
      className="m-shell"
      style={{
        '--m-brand': theme.primaryColor,
        '--m-on': theme.onPrimary,
        background: theme.canvas,
        color: theme.ink,
        fontFamily: theme.fontFamily,
      }}
    >
      <header className="m-top">
        <Link className="m-top__brand" to={base}>{tenant.name}</Link>
        {loggedIn ? (
          <button type="button" className="m-top__action" onClick={logout}>Odjava</button>
        ) : (
          <Link className="m-top__action" to="/login">Prijava</Link>
        )}
      </header>
      <div className="m-main">
        <Outlet context={{ tenant, membership, isMember, loggedIn, session, palette }} />
      </div>
      <nav className="m-tabs" aria-label="Član">
        <NavLink to={base} end>
          <IconHome />
          <span>Početna</span>
        </NavLink>
        <NavLink to={`${base}/termini`}>
          <IconBook />
          <span>Termini</span>
        </NavLink>
        <NavLink to={`${base}/online`}>
          <IconPlay />
          <span>Online</span>
        </NavLink>
        {loggedIn ? (
          <NavLink to={`${base}/privatnost`}>
            <IconLock />
            <span>Privatnost</span>
          </NavLink>
        ) : (
          <NavLink to="/login">
            <IconLock />
            <span>Prijava</span>
          </NavLink>
        )}
      </nav>
      <ConsentBanner />
      <InstallAppBanner />
    </div>
  );
}
