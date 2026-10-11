import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../api/authApi.js';
import './RegisterPage.scss';

function localProblems(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Upišite ispravnu e-poštu.';
  }
  return '';
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  async function onSubmit(event) {
    event.preventDefault();
    const problem = localProblems(email);
    setError(problem);
    if (problem) return;

    try {
      await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      setSent(true);
    } catch (failure) {
      if (failure?.status === 'FETCH_ERROR') {
        setError('Poslužitelj nije dostupan. Pokušajte ponovno za trenutak.');
        return;
      }
      if (failure?.status === 429) {
        setError('Previše pokušaja. Pričekajte malo pa pokušajte ponovno.');
        return;
      }
      setError('Zahtjev nije uspio. Pokušajte ponovno.');
    }
  }

  if (sent) {
    return (
      <main className="register">
        <h1>Provjerite e-poštu.</h1>
        <p className="register__lead">
          Ako račun postoji, poslali smo link za postavljanje nove lozinke.
          Link vrijedi 60 minuta.
        </p>
        <p className="register__login">
          <Link to="/login">Natrag na prijavu</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="register">
      <h1>Zaboravljena lozinka.</h1>
      <p className="register__lead">
        Ista prijava za člana i za studio. Upišite e-poštu računa — pošaljemo link za novu lozinku.
      </p>
      <form className="register__form" onSubmit={onSubmit} noValidate>
        <label>
          E-pošta
          <input
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            aria-invalid={Boolean(error)}
          />
        </label>
        {error ? <p className="register__form-error">{error}</p> : null}
        <button className="register__submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Šaljemo…' : 'Pošaljite link'}
        </button>
      </form>
      <p className="register__login">
        Sjećate se lozinke? <Link to="/login">Prijavite se</Link>
      </p>
    </main>
  );
}
