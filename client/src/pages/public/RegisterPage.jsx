import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleAuthMutation } from '../../api/authApi.js';
import { useLazyMyTenantsQuery } from '../../api/tenantApi.js';
import GoogleAuthButton from '../../components/GoogleAuthButton.jsx';
import { loadStudio, saveStudio } from '../../lib/studio.js';
import { studioFromTenant } from '../owner/studioSync.js';
import BusinessSignupForm from './BusinessSignupForm.jsx';
import './RegisterPage.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [googleAuth, { isLoading }] = useGoogleAuthMutation();
  const [loadMine] = useLazyMyTenantsQuery();
  const [error, setError] = useState('');

  async function onGoogleCredential(idToken, intent = 'register') {
    setError('');
    try {
      const result = await googleAuth({ idToken, intent }).unwrap();
      const nextSession = {
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        detail: 'Račun studija je otvoren.',
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      localStorage.setItem(TOKEN_KEY, result.token);

      if (result.user.role === 'BUSINESS_OWNER') {
        try {
          const mine = await loadMine().unwrap();
          const owned = mine.tenants?.find((item) => item.role === 'BUSINESS_OWNER');
          if (owned?.tenant) {
            saveStudio(studioFromTenant(owned.tenant, loadStudio() || {}));
            window.dispatchEvent(new Event('studio-changed'));
            navigate('/stranica', { replace: true });
            return;
          }
        } catch {
          /* continue to setup */
        }
        navigate('/postavljanje', { replace: true });
        return;
      }

      navigate('/', { replace: true });
    } catch (failure) {
      if (failure?.data?.code === 'GOOGLE_NOT_CONFIGURED') {
        setError('Google registracija nije uključena na poslužitelju.');
        return;
      }
      setError(failure?.data?.message || 'Google registracija nije uspjela.');
    }
  }

  return (
    <main className="register">
      <div className="register__atmosphere" aria-hidden="true">
        <span className="register__orb register__orb--a" />
        <span className="register__orb register__orb--b" />
        <span className="register__grain" />
        <span className="register__watermark">anyminutes</span>
      </div>

      <div className="register__shell">
        <header className="register__intro">
          <p className="register__brand">anyminutes</p>
          <h1>Pokrenite svoj prostor.</h1>
          <p className="register__lead">
            Za studije, igraonice, salone i ostala poslovanja koja rade po terminima.
            Odaberite naziv i dobit ćete vlastitu poveznicu za rezervacije —
            podijelite je klijentima, oni rezerviraju sami.
          </p>
        </header>

        <div className="register__google">
          <GoogleAuthButton
            intent="register"
            disabled={isLoading}
            label="brzi početak"
            onCredential={onGoogleCredential}
            onError={(message) => setError(message)}
          />
          {error ? <p className="register__google-error">{error}</p> : null}
          <p className="register__google-note">
            Nakon Googlea dovršite postavljanje studija — ili ispunite obrazac ispod.
          </p>
        </div>

        <BusinessSignupForm className="register__desk" />

        <p className="register__login">
          Natrag na <Link to="/">početnu</Link>
          {' · '}
          <Link to="/login">Prijava</Link>
        </p>
      </div>
    </main>
  );
}
