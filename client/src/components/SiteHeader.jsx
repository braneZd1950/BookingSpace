import { useDispatch } from 'react-redux';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { api } from '../api/api.js';
import { useGetMeQuery } from '../api/authApi.js';
import './SiteHeader.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

const adminLinks = [
  ['/analitika', 'Pregled', true],
  ['/analitika/studiji', 'Studiji', false],
  ['/analitika/korisnici', 'Korisnici', false],
  ['/analitika/aktivnost', 'Aktivnost', false],
  ['/analitika/placanja', 'Plaćanja', false],
  ['/analitika/izvjestaji', 'Izvještaji', false],
  ['/analitika/sustav', 'Sustav', false],
];

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
    return (
      <header className="site-header site-header--admin">
        <Link className="site-header__brand" to="/analitika">
          BookingSpace
        </Link>
        <nav className="site-header__nav" aria-label="Platforma">
          {adminLinks.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}>
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            className="site-header__logout"
            onClick={logout}
          >
            Odjava
          </button>
        </nav>
      </header>
    );
  }

  return (
    <header className="site-header">
      <Link className="site-header__brand" to="/">
        BookingApp
      </Link>
      <nav className="site-header__nav" aria-label="Račun">
        <Link to="/login">Prijava</Link>
        <Link className="site-header__cta" to="/register">
          Postanite partner
        </Link>
      </nav>
    </header>
  );
}
