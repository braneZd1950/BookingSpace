import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useGoogleAuthMutation,
  useLazyGetMeQuery,
  useLoginMutation,
} from '../../api/authApi.js';
import { useLazyListMyMembershipsQuery } from '../../api/membershipApi.js';
import { useLazyMyTenantsQuery } from '../../api/tenantApi.js';
import GoogleAuthButton from '../../components/GoogleAuthButton.jsx';
import PasswordField from '../../components/PasswordField.jsx';
import { business, member } from '../../mock/data.js';
import { loadStudio, saveStudio } from '../../lib/studio.js';
import { IS_DEV } from '../../lib/runtimeEnv.js';
import { studioFromTenant } from '../owner/studioSync.js';
import './LoginPage.scss';
import { isEmail } from '../../lib/isEmail.js';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';
const showDemoKeys = IS_DEV;

const trials = [
  {
    email: member.email,
    session: {
      name: member.name,
      email: member.email,
      role: member.role,
      detail: `Član studija ${business.name}, iskorišten je ${member.membership.sessionsUsed} od ${member.membership.sessionsIncluded} treninga.`,
    },
  },
  {
    email: business.owner.email,
    session: {
      name: business.owner.name,
      email: business.owner.email,
      role: business.owner.role,
      detail: business.name,
    },
  },
];

function localProblems(values) {
  const problems = {};
  if (!isEmail(values.email.trim())) {
    problems.email = 'Upišite ispravnu e-poštu.';
  }
  if (!values.password) problems.password = 'Upišite lozinku.';
  return problems;
}

function remember(session, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function LoginShell({ done = false, children }) {
  return (
    <main className={`login${done ? ' login--done' : ''}`}>
      <div className="login__atmosphere" aria-hidden="true">
        <span className="login__shaft" />
        <span className="login__orb login__orb--a" />
        <span className="login__orb login__orb--b" />
        <span className="login__grain" />
      </div>
      <div className="login__layout">
        <aside className="login__spine" aria-hidden="true">
          <p className="login__spine-mark">anyminutes</p>
        </aside>
        <div className="login__stage">{children}</div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  const [values, setValues] = useState({ email: '', password: '' });
  const [problems, setProblems] = useState({});
  const [formError, setFormError] = useState('');
  const [session, setSession] = useState(null);
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const [googleAuth, { isLoading: googleLoading }] = useGoogleAuthMutation();
  const [loadMe] = useLazyGetMeQuery();
  const [loadMine] = useLazyMyTenantsQuery();
  const [loadMemberships] = useLazyListMyMembershipsQuery();

  async function openMemberStudio(nextSession) {
    try {
      const mine = await loadMemberships(50).unwrap();
      const active = (mine.memberships || []).find(
        (item) => item.status === 'ACTIVE' && item.tenant?.slug,
      );
      if (active?.tenant?.slug) {
        navigate(`/s/${active.tenant.slug}`, { replace: true });
        return true;
      }
      const tenants = await loadMine().unwrap();
      const customer = (tenants.tenants || []).find((item) => item.role === 'CUSTOMER')
        || (tenants.tenants || [])[0];
      if (customer?.tenant?.slug) {
        navigate(`/s/${customer.tenant.slug}`, { replace: true });
        return true;
      }
    } catch {
      // fall through to confirmation screen
    }
    setSession(nextSession);
    return false;
  }

  async function openGuide(nextSession) {
    if (nextSession.role === 'BUSINESS_OWNER') {
      if (!loadStudio()?.guideDone) {
        navigate('/postavljanje', { replace: true });
        return;
      }
      navigate('/stranica', { replace: true });
      return;
    }
    await openMemberStudio(nextSession);
  }

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setProblems((current) => ({ ...current, [field]: '' }));
    setFormError('');
  }

  async function finishAuth(result, trial) {
    const nextSession = {
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      detail: (result.user.role === 'ADMIN' || result.user.role === 'PLATFORM_STAFF')
        ? 'Platforma anyminutes'
        : result.user.role === 'BUSINESS_OWNER'
          ? (trial?.session.detail || 'Račun studija je otvoren.')
          : (trial?.session.detail || 'Račun člana je otvoren.'),
    };
    remember(nextSession, result.token);

    try {
      const me = await loadMe().unwrap();
      if (
        me.platformAdmin
        || result.user.role === 'ADMIN'
        || result.user.role === 'PLATFORM_STAFF'
      ) {
        navigate('/admin', { replace: true });
        return;
      }
    } catch {
      if (result.user.role === 'ADMIN' || result.user.role === 'PLATFORM_STAFF') {
        navigate('/admin', { replace: true });
        return;
      }
    }

    if (result.user.role === 'BUSINESS_OWNER') {
      try {
        const mine = await loadMine().unwrap();
        const owned = mine.tenants?.find((item) => item.role === 'BUSINESS_OWNER')
          || mine.tenants?.find((item) => item.role === 'STAFF');
        if (owned?.tenant) {
          const tenant = owned.tenant;
          nextSession.detail = tenant.name;
          remember(nextSession, result.token);
          saveStudio(studioFromTenant(tenant, loadStudio() || {}));
          window.dispatchEvent(new Event('studio-changed'));
        }
      } catch {
        // owner can still continue into studio shell
      }
      await openGuide(nextSession);
      return;
    }

    await openMemberStudio(nextSession);
  }

  async function onGoogleCredential(idToken, intent = 'login') {
    setFormError('');
    try {
      const result = await googleAuth({ idToken, intent }).unwrap();
      await finishAuth(result);
    } catch (error) {
      if (error?.status === 'FETCH_ERROR') {
        setFormError('Poslužitelj nije dostupan. Pokušajte ponovno za trenutak.');
        return;
      }
      if (error?.data?.code === 'GOOGLE_NOT_CONFIGURED') {
        setFormError('Google prijava nije uključena na poslužitelju.');
        return;
      }
      setFormError(error?.data?.message || 'Google prijava nije uspjela.');
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextProblems = localProblems(values);
    setProblems(nextProblems);
    setFormError('');
    if (Object.keys(nextProblems).length > 0) return;

    const email = values.email.trim().toLowerCase();
    const trial = trials.find((item) => item.email === email);

    try {
      const result = await login({ email, password: values.password }).unwrap();
      await finishAuth(result, trial);
      return;
    } catch (error) {
      if (error?.status === 'FETCH_ERROR') {
        setFormError('Poslužitelj nije dostupan. Pokušajte ponovno za trenutak.');
        return;
      }
      if (error?.data?.code === 'GOOGLE_ONLY') {
        setFormError('Ovaj račun koristi Google prijavu — kliknite gumb ispod.');
        return;
      }
      if (error?.data?.code === 'INVALID_CREDENTIALS') {
        setFormError('E-pošta ili lozinka nije točna.');
        return;
      }
      setFormError('Prijava nije prošla. Pokušajte ponovno.');
    }
  }

  if (session) {
    return (
      <LoginShell done>
        <header className="login__intro">
          <p className="login__kicker">Sesija otvorena</p>
          <h1>Prijavljeni ste.</h1>
          <p className="login__done-detail">
            {session.name}
            <br />
            {session.detail}
          </p>
        </header>
        <div className="login__done-actions">
          <Link className="login__submit" to="/">
            Natrag na početnu
          </Link>
          {session.role === 'BUSINESS_OWNER' ? (
            <p className="login__links">
              <Link to="/stranica">Otvorite stranicu</Link>
            </p>
          ) : (
            <p className="login__done-detail">
              Kad studio aktivira članarinu, ovdje ćete otvoriti termine na
              {' '}
              <code>/s/…</code>
              .
            </p>
          )}
        </div>
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <header className="login__intro">
        <p className="login__kicker">Jedan ulaz</p>
        <h1>Prijavite se.</h1>
        <p className="login__lead">Ista prijava za člana i za studio.</p>
      </header>

      <form className="login__panel" onSubmit={onSubmit} noValidate>
        <label className="login__field">
          E-pošta
          <input
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(problems.email)}
          />
          {problems.email ? <span className="login__error">{problems.email}</span> : null}
        </label>

        <PasswordField
          label="Lozinka"
          className="login__field"
          wrapClassName="login__password-wrap"
          buttonClassName="login__eye"
          name="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) => update('password', event.target.value)}
          invalid={Boolean(problems.password)}
        />
        {problems.password ? <span className="login__error">{problems.password}</span> : null}

        {formError ? <p className="login__form-error">{formError}</p> : null}

        <button className="login__submit" type="submit" disabled={isLoading || googleLoading}>
          {isLoading ? 'Prijavljujemo…' : 'Prijavite se'}
        </button>

        <GoogleAuthButton
          intent="login"
          disabled={isLoading || googleLoading}
          onCredential={onGoogleCredential}
          onError={(message) => setFormError(message)}
        />
      </form>

      <p className="login__links">
        <Link to="/zaboravljena-lozinka">Zaboravljena lozinka?</Link>
        <span>
          Nemate račun?
          {' '}
          <Link to="/register">Registrirajte se</Link>
        </span>
      </p>

      {showDemoKeys ? (
        <p className="login__keys">
          <strong>Probni računi (seed:demo)</strong>
          Član:
          {' '}
          <code>{member.email}</code>
          <br />
          Studio:
          {' '}
          <code>{business.owner.email}</code>
          <br />
          Lozinka je ispisana u konzoli nakon
          {' '}
          <code>npm --prefix server run seed:demo</code>
          .
        </p>
      ) : null}
    </LoginShell>
  );
}
