import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import ConsentBanner from '@client/components/ConsentBanner.jsx';
import InstallAppBanner from '@client/components/InstallAppBanner.jsx';

const TOKEN_KEY = 'bookingspace.token';

export default function MobilePublicLayout() {
  const { pathname, hash } = useLocation();
  const loggedIn = Boolean(localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const target = document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView({ block: 'start' });
  }, [pathname, hash]);

  return (
    <div className="m-shell m-shell--public">
      <header className="m-top">
        <Link className="m-top__brand" to="/">anyminutes</Link>
        <nav className="m-public-nav" aria-label="Račun">
          {loggedIn ? (
            <Link to="/stranica">Studio</Link>
          ) : (
            <>
              <Link to="/login">Prijava</Link>
              <Link className="m-cta" to="/register">Partner</Link>
            </>
          )}
        </nav>
      </header>
      <div className="m-main">
        <Outlet />
      </div>
      <ConsentBanner />
      <InstallAppBanner />
    </div>
  );
}
