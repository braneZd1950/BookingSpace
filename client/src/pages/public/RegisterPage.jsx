import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleAuthMutation } from '../../api/authApi.js';
import { useLazyMyTenantsQuery } from '../../api/tenantApi.js';
import GoogleAuthButton from '../../components/GoogleAuthButton.jsx';
import { loadStudio, saveStudio } from '../../lib/studio.js';
import { studioFromTenant } from '../owner/studioSync.js';
import BusinessSignupForm from './BusinessSignupForm.jsx';
import ClientSignupForm from './ClientSignupForm.jsx';
import './RegisterPage.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

/**
 * /register — isti vizualni jezik kao /login; izbor klijent vs partner.
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [path, setPath] = useState(null); // null | 'civilian' | 'partner'
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

  const intro =
    path === 'civilian'
      ? {
          kicker: 'Klijent',
          title: 'Otvorite korisnički račun.',
          lead: 'Za pretraživanje i rezervacije kod partnera — studiji, igraonice, wellness i ostalo.',
        }
      : path === 'partner'
        ? {
            kicker: 'Partner',
            title: 'Pokrenite svoj prostor.',
            lead:
              'Naziv, niša i račun, zatim izgled stranice (predložak, raspored, boja). Sve kasnije možete promijeniti.',
          }
        : {
            kicker: 'Registracija',
            title: 'Kako se želite registrirati?',
            lead:
              'Odaberite što vam odgovara. Klijenti rezerviraju termine kod partnera, a partneri nude svoje usluge.',
          };

  const modeClass = path ? `register--${path}` : 'register--choose';

  return (
    <main className={`register register--atelier ${modeClass}`}>
      <div className="register__atmosphere" aria-hidden="true">
        <span className="register__shaft" />
        <span className="register__orb register__orb--a" />
        <span className="register__orb register__orb--b" />
        <span className="register__grain" />
      </div>

      <div className="register__layout">
        <aside className="register__spine" aria-hidden="true">
          <p className="register__spine-mark">anyminutes</p>
        </aside>

        <div className="register__stage">
          <header className="register__intro">
            {path ? (
              <button
                type="button"
                className="register__back"
                onClick={() => {
                  setPath(null);
                  setError('');
                }}
              >
                ← Izbor uloge
              </button>
            ) : null}
            <p className="register__kicker">{intro.kicker}</p>
            <h1>{intro.title}</h1>
            <p className="register__lead">{intro.lead}</p>
          </header>

          {!path ? (
            <div className="register__paths" role="group" aria-label="Vrsta registracije">
              <button
                type="button"
                className="register__path"
                onClick={() => setPath('civilian')}
              >
                <span className="register__path-kicker">Klijent</span>
                <span className="register__path-title">Želim rezervirati termine</span>
                <span className="register__path-note">
                  Račun za rezervacije kod partnera, bez otvaranja vlastitog prostora.
                </span>
                <span className="register__path-cta">Nastavi kao klijent</span>
              </button>
              <button
                type="button"
                className="register__path"
                onClick={() => setPath('partner')}
              >
                <span className="register__path-kicker">Partner</span>
                <span className="register__path-title">Nudim svoje usluge</span>
                <span className="register__path-note">
                  Studio, igraonica, salon ili wellness — odaberite vrstu posla i
                  pokrenite vlastiti prostor.
                </span>
                <span className="register__path-cta">Nastavi kao partner</span>
              </button>
            </div>
          ) : null}

          {path === 'partner' ? (
            <>
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
                  Nakon Googlea dovršite postavljanje — uključujući vrstu poslovanja — ili
                  ispunite obrazac ispod.
                </p>
              </div>
              <BusinessSignupForm className="register__desk" />
            </>
          ) : null}

          {path === 'civilian' ? (
            <ClientSignupForm className="register__desk" />
          ) : null}

          <p className="register__links">
            <Link to="/">Natrag na početnu</Link>
            <Link to="/login">Prijava</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
