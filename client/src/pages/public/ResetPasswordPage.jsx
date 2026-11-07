import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../api/authApi.js';
import PasswordField from '../../components/PasswordField.jsx';
import './RegisterPage.scss';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
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
        <PasswordField
          label="Nova lozinka"
          className="register__password"
          wrapClassName="register__password-wrap"
          buttonClassName="register__eye"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError('');
          }}
          placeholder="Najmanje 8 znakova"
        />
        <label className="register__password">
          Ponovite lozinku
          <span className="register__password-wrap">
            <input
              name="passwordAgain"
              type="password"
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
