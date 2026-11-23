import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useConfirmEmailChangeMutation } from '../../api/authApi.js';
import { SeoNoIndex } from '../../components/SeoHead.jsx';
import './RegisterPage.scss';

const TOKEN_KEY = 'bookingspace.token';

export default function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);
  const navigate = useNavigate();
  const [confirmEmail, { isLoading }] = useConfirmEmailChangeMutation();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    void (async () => {
      setError('');
      try {
        const result = await confirmEmail({ token }).unwrap();
        if (cancelled) return;
        if (result?.token) {
          localStorage.setItem(TOKEN_KEY, result.token);
        }
        setDone(true);
      } catch (failure) {
        if (cancelled) return;
        if (failure?.data?.code === 'EMAIL_CONFIRM_INVALID') {
          setError('Link je istekao ili nije valjan. Zatražite novi iz postavki.');
          return;
        }
        if (failure?.data?.code === 'EMAIL_TAKEN') {
          setError('Ta e-pošta je već zauzeta. Pokušajte drugu adresu.');
          return;
        }
        setError('E-pošta nije potvrđena. Pokušajte ponovno.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, confirmEmail]);

  if (!token) {
    return (
      <main className="register">
        <SeoNoIndex title="Potvrda e-pošte — Blizari" />
        <h1>Link nije valjan.</h1>
        <p className="register__lead">
          Otvorite link iz poruke ili zatražite novi iz postavki računa.
        </p>
        <p className="register__login">
          <Link to="/login">Prijava</Link>
        </p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="register">
        <SeoNoIndex title="Potvrda e-pošte — Blizari" />
        <h1>E-pošta je potvrđena.</h1>
        <p className="register__lead">
          Nova adresa je spremljena na vaš Blizari račun.
        </p>
        <button
          className="register__submit"
          type="button"
          onClick={() => navigate('/login', { replace: true })}
        >
          Nastavite
        </button>
      </main>
    );
  }

  return (
    <main className="register">
      <SeoNoIndex title="Potvrda e-pošte — Blizari" />
      <h1>Potvrda e-pošte</h1>
      <p className="register__lead">
        {isLoading ? 'Potvrđujemo novu adresu…' : (error || 'Pripremamo potvrdu…')}
      </p>
      {error ? (
        <p className="register__login">
          <Link to="/login">Prijava</Link>
        </p>
      ) : null}
    </main>
  );
}
