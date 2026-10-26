import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateTenantMutation, useRegisterMutation } from '../../api/authApi.js';
import { useRecordConsentMutation } from '../../api/consentApi.js';
import { CONSENT_VERSION, acceptLocally, getAnonymousKey } from '../../consent.js';
import { findPalette, studioPalettes } from '../../styles/studioPalette.js';
import { saveStudio } from '../../studio.js';
import {
  findTemplate,
  nicheFromTemplate,
  siteTemplates,
  studioHost,
} from '../owner/siteTemplates.js';
import { previewSlug } from './businessSlug.js';
import './BusinessSignupForm.scss';

const TOKEN_KEY = 'bookingspace.token';

const empty = {
  email: '',
  businessName: '',
  password: '',
  passwordAgain: '',
  acceptTerms: false,
  template: 'fitness',
  palette: 'navy',
};

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

function PasswordField({
  label,
  name,
  value,
  onChange,
  invalid,
  error,
  autoComplete = 'new-password',
}) {
  const [visible, setVisible] = useState(false);
  const tip = visible ? 'Sakrij lozinku' : 'Prikaži lozinku';

  return (
    <label className="biz-form__password">
      {label}
      <span className="biz-form__password-wrap">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          aria-invalid={invalid}
        />
        <button
          type="button"
          className="biz-form__eye"
          onClick={() => setVisible((current) => !current)}
          title={tip}
          aria-label={tip}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
      {error ? <span className="biz-form__error">{error}</span> : null}
    </label>
  );
}

function basicsProblems(values) {
  const problems = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    problems.email = 'Upišite ispravnu e-poštu.';
  }
  if (!values.businessName.trim()) {
    problems.businessName = 'Upišite naziv obrta, j.d.o.o. ili studija.';
  } else if (!previewSlug(values.businessName)) {
    problems.businessName = 'Dodajte slovo ili broj u naziv — od toga nastaje adresa.';
  }
  if (values.password.length < 8) {
    problems.password = 'Lozinka treba najmanje 8 znakova.';
  }
  if (!values.passwordAgain) {
    problems.passwordAgain = 'Ponovite lozinku.';
  } else   if (values.password !== values.passwordAgain) {
    problems.passwordAgain = 'Lozinke se ne podudaraju.';
  }
  if (!values.acceptTerms) {
    problems.acceptTerms = 'Potrebno je prihvatiti privatnost i uvjete korištenja.';
  }
  return problems;
}

function apiMessage(error) {
  if (error?.status === 'FETCH_ERROR') {
    if (import.meta.env.DEV) {
      return 'Poslužitelj nije dostupan. Provjerite da API radi (npm run dev) na portu 4001.';
    }
    return 'Poslužitelj nije dostupan. Provjerite da frontend ima VITE_API_URL (Render build) i da API dozvoljava vaš frontend origin (CLIENT_ORIGIN).';
  }
  const body = error?.data;
  if (body?.code === 'CSRF_REQUIRED') {
    if (import.meta.env.DEV) {
      return 'Zahtjev je otišao na krivi API. Restartajte npm run dev (BookingApp koristi port 4001).';
    }
    return 'Zahtjev je otišao na krivi API. Provjerite VITE_API_URL na frontend servisu.';
  }
  if (typeof body?.message === 'string' && body.message.trim()) {
    return body.message;
  }
  return '';
}

export default function BusinessSignupForm({ className = '' }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(empty);
  const [problems, setProblems] = useState({});
  const [formError, setFormError] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();
  const [recordConsent] = useRecordConsentMutation();
  const isLoading = isRegistering || isCreating;
  const slug = previewSlug(values.businessName);
  const chosen = findPalette(values.palette);
  const template = findTemplate(values.template);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setProblems((current) => ({ ...current, [field]: '' }));
    setFormError('');
  }

  function pickTemplate(templateId) {
    const item = findTemplate(templateId);
    setValues((current) => ({
      ...current,
      template: item.id,
      palette: item.palette,
    }));
    setFormError('');
  }

  function goDesign(event) {
    event.preventDefault();
    const nextProblems = basicsProblems(values);
    setProblems(nextProblems);
    setFormError('');
    if (Object.keys(nextProblems).length > 0) return;
    setStep(1);
  }

  async function finish(event) {
    event.preventDefault();
    setFormError('');
    const nextProblems = basicsProblems(values);
    setProblems(nextProblems);
    if (Object.keys(nextProblems).length > 0) {
      setStep(0);
      return;
    }

    try {
      let accessToken = token;
      if (!accessToken) {
        const account = await register({
          name: values.businessName.trim(),
          email: values.email.trim(),
          password: values.password,
          role: 'BUSINESS_OWNER',
        }).unwrap();
        accessToken = account.token;
        localStorage.setItem(TOKEN_KEY, accessToken);
        setToken(accessToken);
        acceptLocally('register');
        try {
          await recordConsent({
            action: 'accept',
            version: CONSENT_VERSION,
            source: 'register',
            path: '/register',
            anonymousKey: getAnonymousKey(),
          }).unwrap();
        } catch {
          /* račun postoji; banner/postavke mogu ponoviti privolu */
        }
      }

      const created = await createTenant({
        name: values.businessName.trim(),
        niche: nicheFromTemplate(values.template),
        email: values.email.trim(),
        timezone: 'Europe/Zagreb',
        template: findTemplate(values.template).id,
      }).unwrap();

      localStorage.setItem(TOKEN_KEY, accessToken);
      saveStudio({
        ...created.tenant,
        template: template.id,
        layout: template.layout,
        palette: values.palette,
        guideDone: false,
      });
      navigate('/postavljanje', { replace: true, state: { step: 2 } });
    } catch (error) {
      const body = error?.data;
      if (body?.code === 'EMAIL_TAKEN') {
        setProblems({ email: 'Ta e-pošta je već registrirana. Prijavite se.' });
        setStep(0);
        return;
      }
      if (body?.code === 'INVALID_SLUG') {
        setProblems({ businessName: 'Iz ovog naziva ne nastaje valjan slug. Promijenite naziv.' });
        setStep(0);
        return;
      }
      const detail = apiMessage(error);
      if (detail) {
        setFormError(detail);
        return;
      }
      setFormError(token
        ? 'Račun je otvoren, poslovanje još nije. Pokušajte još jednom.'
        : 'Registracija nije prošla. Pokušajte ponovno.');
    }
  }

  return (
    <div className={`biz-form ${className}`.trim()} id="otvorite">
      <p className="biz-form__steps" aria-live="polite">
        Korak {step + 1} od 2
      </p>

      {step === 0 ? (
        <form className="biz-form__panel" onSubmit={goDesign} noValidate>
          <label>
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
            {problems.email ? <span className="biz-form__error">{problems.email}</span> : null}
          </label>

          <label>
            Naziv obrta / j.d.o.o. / studija
            <input
              name="organization"
              autoComplete="organization"
              value={values.businessName}
              onChange={(event) => update('businessName', event.target.value)}
              aria-invalid={Boolean(problems.businessName)}
              placeholder="npr. Fitness Studio Zadar"
            />
            {slug ? (
              <span className="biz-form__slug">
                Adresa: <strong>{studioHost(slug)}</strong>
              </span>
            ) : (
              <span className="biz-form__hint">Iz naziva nastaje poddomena na booking.hr</span>
            )}
            {problems.businessName ? (
              <span className="biz-form__error">{problems.businessName}</span>
            ) : null}
          </label>

          <PasswordField
            label="Lozinka"
            name="password"
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            invalid={Boolean(problems.password)}
            error={problems.password}
          />

          <PasswordField
            label="Ponovi lozinku"
            name="passwordAgain"
            value={values.passwordAgain}
            onChange={(event) => update('passwordAgain', event.target.value)}
            invalid={Boolean(problems.passwordAgain)}
            error={problems.passwordAgain}
          />

          <label className="biz-form__consent">
            <input
              type="checkbox"
              checked={values.acceptTerms}
              onChange={(event) => update('acceptTerms', event.target.checked)}
              aria-invalid={Boolean(problems.acceptTerms)}
            />
            <span>
              Prihvaćam
              {' '}
              <Link to="/privatnost" target="_blank" rel="noreferrer">privatnost</Link>
              {' '}
              i
              {' '}
              <Link to="/uvjeti" target="_blank" rel="noreferrer">uvjete korištenja</Link>
              .
            </span>
          </label>
          {problems.acceptTerms ? (
            <span className="biz-form__error">{problems.acceptTerms}</span>
          ) : null}

          <button className="biz-form__submit" type="submit">
            Dalje
          </button>

          <p className="biz-form__login">
            Već imate račun? <Link to="/login">Prijavite se</Link>
          </p>
        </form>
      ) : null}

      {step === 1 ? (
        <form className="biz-form__panel" onSubmit={finish} noValidate>
          <div className="biz-form__block">
            <h3>Predložak stranice</h3>
            <p className="biz-form__hint">Odaberite početni izgled. Kasnije možete mijenjati.</p>
            <div className="biz-templates" role="radiogroup" aria-label="Predložak">
              {siteTemplates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={values.template === item.id}
                  className={values.template === item.id ? 'biz-template is-selected' : 'biz-template'}
                  onClick={() => pickTemplate(item.id)}
                >
                  <span className="biz-template__name">{item.name}</span>
                  <span className="biz-template__note">{item.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="biz-form__block">
            <h3>Boja</h3>
            <p className="biz-form__hint">
              {chosen.name} — {studioPalettes.length} nijansi u ponudi.
            </p>
            <div className="biz-swatches" role="radiogroup" aria-label="Boja stranice">
              {studioPalettes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-label={item.name}
                  aria-checked={values.palette === item.id}
                  className={values.palette === item.id ? 'biz-swatch is-selected' : 'biz-swatch'}
                  style={{
                    background: `linear-gradient(135deg, ${item.theme.primaryColor} 55%, ${item.theme.secondaryColor} 55%)`,
                  }}
                  onClick={() => update('palette', item.id)}
                />
              ))}
            </div>
          </div>

          <article
            className="biz-preview"
            style={{
              background: chosen.theme.canvas,
              color: chosen.theme.ink,
              fontFamily: chosen.theme.fontFamily,
              '--preview-brand': chosen.theme.primaryColor,
              '--preview-on': chosen.theme.onPrimary,
            }}
          >
            <p className="biz-preview__host">{studioHost(slug)}</p>
            <h4>{values.businessName.trim() || 'Vaš studio'}</h4>
            <p>Predložak: {template.name}. Boja: {chosen.name}.</p>
            <span
              className="biz-preview__cta"
              style={{ background: chosen.theme.primaryColor, color: chosen.theme.onPrimary }}
            >
              Odaberite termin
            </span>
          </article>

          {formError ? <p className="biz-form__form-error">{formError}</p> : null}

          <div className="biz-form__actions">
            <button className="biz-form__back" type="button" onClick={() => setStep(0)}>
              Natrag
            </button>
            <button className="biz-form__submit" type="submit" disabled={isLoading}>
              {isLoading ? 'Otvaramo…' : 'Otvorite račun'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
