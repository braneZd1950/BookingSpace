import { useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api/api.js';
import { useGetMeQuery } from '../api/authApi.js';
import './SiteHeader.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

const adminLinks = [
  ['/admin', 'Admin', true],
  ['/analitika', 'Pregled', true],
  ['/analitika/studiji', 'Studiji', false],
  ['/analitika/korisnici', 'Korisnici', false],
  ['/analitika/aktivnost', 'Aktivnost', false],
  ['/analitika/placanja', 'Plaćanja', false],
  ['/analitika/izvjestaji', 'Izvještaji', false],
  ['/analitika/sustav', 'Sustav', false],
];

function NavIcon({ children }) {
  return (
    <svg
      className="site-header__icon"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function IconCompass() {
  return (
    <NavIcon>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path fill="currentColor" d="M14.8 9.2 13.1 13.1 9.2 14.8l1.7-3.9z" />
    </NavIcon>
  );
}

function IconSteps() {
  return (
    <NavIcon>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 17h4v3H4zm6-6h4v9h-4zm6-7h4v16h-4z"
      />
    </NavIcon>
  );
}

function IconStar() {
  return (
    <NavIcon>
      <path
        fill="currentColor"
        d="m12 3.2 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.4l5-.7z"
      />
    </NavIcon>
  );
}

function IconHelp() {
  return (
    <NavIcon>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M9.6 9.2a2.5 2.5 0 1 1 3.6 2.2c-.8.5-1.2 1-1.2 2"
      />
      <circle cx="12" cy="16.6" r="1" fill="currentColor" />
    </NavIcon>
  );
}

function IconLogin() {
  return (
    <NavIcon>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 12h9m0 0-3-3m3 3-3 3M13 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h6"
      />
    </NavIcon>
  );
}

function IconRegister() {
  return (
    <NavIcon>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M19 8v6m3-3h-6"
      />
    </NavIcon>
  );
}

function IconStudio() {
  return (
    <NavIcon>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-6h6v6"
      />
    </NavIcon>
  );
}

function IconLogout() {
  return (
    <NavIcon>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 12H5m0 0 3-3m-3 3 3 3M11 5h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6"
      />
    </NavIcon>
  );
}

function NavItem({ to, label, icon, className = '', end }) {
  const content = (
    <>
      {icon}
      <span className="site-header__label">{label}</span>
    </>
  );

  if (end !== undefined) {
    return (
      <NavLink to={to} end={end} className={className} aria-label={label} title={label}>
        {content}
      </NavLink>
    );
  }

  return (
    <Link to={to} className={className} aria-label={label} title={label}>
      {content}
    </Link>
  );
}

export default function SiteHeader() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = localStorage.getItem(TOKEN_KEY);
  const { data: meData } = useGetMeQuery(undefined, { skip: !token });
  // Without token, ignore cached /me — otherwise admin nav sticks after logout.
  const platformAdmin = Boolean(token && meData?.platformAdmin);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    dispatch(api.util.resetApiState());
    navigate('/', { replace: true });
  }

  if (platformAdmin) {
    const isSuper = Boolean(meData?.platformSuperAdmin);
    return (
      <header className="site-header site-header--admin">
        <Link className="site-header__brand" to="/admin">
          anyminutes
        </Link>
        <nav className="site-header__nav" aria-label="Platforma">
          {adminLinks.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>
              {label}
            </NavLink>
          ))}
          {isSuper ? (
            <NavLink to="/admin/djelatnici">Djelatnici</NavLink>
          ) : null}
          <button
            type="button"
            className="site-header__logout"
            onClick={logout}
            aria-label="Odjava"
            title="Odjava"
          >
            <IconLogout />
            <span className="site-header__label">Odjava</span>
          </button>
        </nav>
      </header>
    );
  }

  if (token) {
    const role = meData?.user?.role;
    return (
      <header className="site-header">
        <Link className="site-header__brand" to="/">
          anyminutes
        </Link>
        <nav className="site-header__nav" aria-label="Račun">
          <NavItem to="/otkrij" label="Otkrij" icon={<IconCompass />} />
          <NavItem to="/#kako" label="Kako funkcionira" icon={<IconSteps />} />
          <NavItem to="/#prednosti" label="Prednosti" icon={<IconStar />} />
          <NavItem to="/#faq" label="Česta pitanja" icon={<IconHelp />} />
          {role === 'BUSINESS_OWNER' ? (
            <NavItem to="/stranica" label="Studio" icon={<IconStudio />} />
          ) : null}
          <button
            type="button"
            className="site-header__logout"
            onClick={logout}
            aria-label="Odjava"
            title="Odjava"
          >
            <IconLogout />
            <span className="site-header__label">Odjava</span>
          </button>
        </nav>
      </header>
    );
  }

  return (
    <header className="site-header">
      <Link className="site-header__brand" to="/">
        anyminutes
      </Link>
      <nav className="site-header__nav" aria-label="Navigacija">
        <NavItem to="/otkrij" label="Otkrij" icon={<IconCompass />} />
        <NavItem to="/#kako" label="Kako funkcionira" icon={<IconSteps />} />
        <NavItem to="/#prednosti" label="Prednosti" icon={<IconStar />} />
        <NavItem to="/#faq" label="Česta pitanja" icon={<IconHelp />} />
        <NavItem to="/login" label="Prijava" icon={<IconLogin />} />
        <NavItem
          to="/register"
          label="Registracija"
          icon={<IconRegister />}
          className="site-header__cta"
        />
      </nav>
    </header>
  );
}
