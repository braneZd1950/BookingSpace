import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLazyGetMeQuery, useLoginMutation } from '../../api/authApi.js';
import { useLazyListMyMembershipsQuery } from '../../api/membershipApi.js';
import { useLazyMyTenantsQuery } from '../../api/tenantApi.js';
import { business, member } from '../../mock/data.js';
import { loadStudio, saveStudio } from '../../lib/studio.js';
import { IS_DEV } from '../../lib/runtimeEnv.js';
import { studioFromTenant } from '../owner/studioSync.js';
import './LoginPage.scss';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';
const showDemoKeys = IS_DEV;

const trials = [
  {
    email: member.email,
    password: member.password,
    session: {
      name: member.name,
      email: member.email,
      role: member.role,
      detail: `Član studija ${business.name}, iskorišten je ${member.membership.sessionsUsed} od ${member.membership.sessionsIncluded} treninga.`,
    },
  },
  {
    email: business.owner.email,
    password: business.owner.password,
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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
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
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
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
            || mine.tenants?.[0];
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
      return;
    } catch (error) {
      if (error?.status === 'FETCH_ERROR') {
        // Mock trial login only in local Vite dev — never for real-user testing builds.
        if (import.meta.env.DEV && trial) {
          if (trial.password !== values.password) {
            setFormError('E-pošta ili lozinka nije točna.');
            return;
          }
          if (trial.session.role === 'BUSINESS_OWNER' && !loadStudio()) {
            saveStudio({
              id: business.id,
              name: business.name,
              slug: business.slug,
              phone: business.phone,
              email: business.email,
              address: business.address,
              timezone: business.timezone,
              description: '',
            });
          }
          remember(trial.session);
          await openGuide(trial.session);
          return;
        }
        setFormError('Poslužitelj nije dostupan. Pokušajte ponovno za trenutak.');
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
            autoFocus
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(problems.email)}
          />
          {problems.email ? <span className="login__error">{problems.email}</span> : null}
        </label>

        <label className="login__field">
          Lozinka
          <span className="login__password-wrap">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => update('password', event.target.value)}
              aria-invalid={Boolean(problems.password)}
            />
            <button
              type="button"
              className="login__eye"
              onClick={() => setShowPassword((current) => !current)}
              title={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
              aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </span>
          {problems.password ? <span className="login__error">{problems.password}</span> : null}
        </label>

        {formError ? <p className="login__form-error">{formError}</p> : null}

        <button className="login__submit" type="submit" disabled={isLoading}>
          {isLoading ? 'Prijavljujemo…' : 'Prijavite se'}
        </button>
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
          <strong>Probni ključevi</strong>
          Član:
          {' '}
          <code>{member.email}</code>
          <br />
          Studio:
          {' '}
          <code>{business.owner.email}</code>
          <br />
          Lozinka:
          {' '}
          <code>{member.password}</code>
        </p>
      ) : null}
    </LoginShell>
  );
}
