import { Link, Outlet } from 'react-router-dom';
import { useGetMeQuery } from '../../api/authApi.js';
import '../public/AnalyticsPage.scss';

const TOKEN_KEY = 'bookingspace.token';

export default function PlatformGate() {
  const token = localStorage.getItem(TOKEN_KEY);
  const { data: meData, isLoading } = useGetMeQuery(undefined, { skip: !token });
  const allowed = Boolean(meData?.platformAdmin);

  if (!token) {
    return (
      <main className="analytics">
        <h1>Platforma</h1>
        <p className="analytics__lead">
          Prijavite se računom s <code>ADMIN_EMAILS</code> za pristup analitici.
        </p>
        <Link to="/login">Prijava</Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="analytics">
        <p>Učitavamo…</p>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="analytics">
        <h1>Nema pristupa</h1>
        <p className="analytics__lead">
          Ova zona je samo za vlasnika aplikacije.
        </p>
        <Link to="/">Početna</Link>
      </main>
    );
  }

  return <Outlet context={{ me: meData }} />;
}
