import { Link, Outlet } from 'react-router-dom';
import { useGetMeQuery } from '../../api/authApi.js';
import { SeoNoIndex } from '../../components/SeoHead.jsx';
import '../public/AnalyticsPage.scss';

const TOKEN_KEY = 'bookingspace.token';

export default function PlatformGate() {
  const token = localStorage.getItem(TOKEN_KEY);
  const { data: meData, isLoading } = useGetMeQuery(undefined, { skip: !token });
  const allowed = Boolean(meData?.platformAdmin);

  if (!token) {
    return (
      <main className="analytics">
        <SeoNoIndex title="Platforma — Blizari" />
        <h1>Platforma</h1>
        <p className="analytics__lead">
          Prijavite se običnom prijavom kao super admin ili djelatnik platforme.
        </p>
        <Link to="/login">Prijava</Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="analytics">
        <SeoNoIndex title="Platforma — Blizari" />
        <p>Učitavamo…</p>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="analytics">
        <SeoNoIndex title="Platforma — Blizari" />
        <h1>Nema pristupa</h1>
        <p className="analytics__lead">
          Ova zona je samo za vlasnika aplikacije.
        </p>
        <Link to="/">Početna</Link>
      </main>
    );
  }

  return (
    <>
      <SeoNoIndex title="Platforma — Blizari" />
      <Outlet context={{ me: meData }} />
    </>
  );
}
