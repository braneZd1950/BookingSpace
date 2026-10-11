import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../api/authApi.js';
import './RegisterPage.scss';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 5c-5 0-9.3 3.1-11 7.5C2.7 16.9 7 20 12 20s9.3-3.1 11-7.5C21.3 8.1 17 5 12 5zm0 12.5A5 5 0 1 1 12 7.5a5 5 0 0 1 0 10zm0-2.2a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3.3 2.2 2.2 3.3l3.1 3.1C3.5 7.6 1.9 9.4 1 12.5 2.7 16.9 7 20 12 20c2 0 3.9-.5 5.5-1.3l3.2 3.2 1.1-1.1L3.3 2.2zM12 18.5c-4.1 0-7.6-2.5-9.1-6 1-2.2 2.6-3.8 4.5-4.7l1.7 1.7A5 5 0 0 0 12 17a4.9 4.9 0 0 0 2.5-.7l1.5 1.5c-1.2.5-2.6.7-4 .7zm9.9-6C20.4 8.6 17.5 6.3 14 5.5l1.7 1.7c1.6.8 3 2.1 3.9 3.8-.5 1.2-1.3 2.3-2.3 3.1l1.2 1.2c1.4-1.1 2.5-2.6 3.4-4.3zM9.2 8.1l1.6 1.6A2.8 2.8 0 0 1 14.3 13l1.5 1.5a5 5 0 0 0-6.6-6.4z"
      />
    </svg>
  );
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('Link za oporavak nije valjan.');
      return;
    }
    if (password.length < 8) {
      setError('Lozinka treba najmanje 8 znakova.');
      return;
    }
    if (password !== again) {
      setError('Lozinke se ne podudaraju.');
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setDone(true);
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setError('Poslužitelj nije dostupan. Pokušajte ponovno za trenutak.');
        return;
      }
      if (failure?.data?.code === 'RESET_INVALID') {
        setError('Link je istekao ili nije valjan. Zatražite novi.');
        return;
      }
      setError('Lozinka nije spremljena. Pokušajte ponovno.');
    }
  }

  if (!token) {
    return (
      <main className="register">
        <h1>Link nije valjan.</h1>
        <p className="register__lead">
          Zatražite novi link za oporavak lozinke.
        </p>
        <p className="register__login">
          <Link to="/zaboravljena-lozinka">Zaboravljena lozinka</Link>
          {' · '}
          <Link to="/login">Prijava</Link>
        </p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="register">
        <h1>Lozinka je spremljena.</h1>
        <p className="register__lead">
          Možete se prijaviti novom lozinkom — isto za člana i za studio.
        </p>
        <button
          className="register__submit"
          type="button"
          onClick={() => navigate('/login', { replace: true })}
        >
          Prijavite se
        </button>
      </main>
    );
  }

  return (
    <main className="register">
      <h1>Nova lozinka.</h1>
      <p className="register__lead">
        Odaberite novu lozinku za svoj račun.
      </p>
      <form className="register__form" onSubmit={onSubmit} noValidate>
        <label className="register__password">
          Nova lozinka
          <span className="register__password-wrap">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError('');
              }}
              placeholder="Najmanje 8 znakova"
            />
            <button
              type="button"
              className="register__eye"
              onClick={() => setShowPassword((current) => !current)}
              title={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
              aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </span>
        </label>
        <label className="register__password">
          Ponovite lozinku
          <span className="register__password-wrap">
            <input
              name="passwordAgain"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={again}
              onChange={(event) => {
                setAgain(event.target.value);
                setError('');
              }}
            />
          </span>
        </label>
        {error ? <p className="register__form-error">{error}</p> : null}
        <button className="register__submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Spremamo…' : 'Spremi lozinku'}
        </button>
      </form>
      <p className="register__login">
        <Link to="/zaboravljena-lozinka">Zatražite novi link</Link>
        {' · '}
        <Link to="/login">Prijava</Link>
      </p>
    </main>
  );
}
