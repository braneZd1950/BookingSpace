import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateTenantMutation, useRegisterMutation } from '../../api/authApi.js';
import { useRecordConsentMutation } from '../../api/consentApi.js';
import { CONSENT_VERSION, acceptLocally, getAnonymousKey } from '../../lib/consent.js';
import { findPalette, palettesForNiche } from '../../styles/studioPalette.js';
import { saveStudio } from '../../lib/studio.js';
import { findLayout, pageLayouts } from '../owner/layouts.js';
import {
  findSignupNiche,
  findTemplate,
  signupNiches,
  siteTemplates,
  studioHost,
  templateForNiche,
} from '../owner/siteTemplates.js';
import { generateAllStudioLegal, paragraphsFromLegal } from '../owner/studioLegal.js';
import { previewSlug } from './businessSlug.js';
import './BusinessSignupForm.scss';

const LEGAL_TABS = [
  {
    id: 'privacy',
    index: '01',
    label: 'Privatnost',
    title: 'Politika privatnosti',
    note: 'Tko obrađuje podatke, svrhe, prava klijenata i AZOP.',
  },
  {
    id: 'terms',
    index: '02',
    label: 'Uvjeti',
    title: 'Uvjeti korištenja',
    note: 'Rezervacije, članarine, odgovornost i mjerodavno pravo RH/EU.',
  },
  {
    id: 'cookies',
    index: '03',
    label: 'Kolačići',
    title: 'Kolačići i sigurnost',
    note: 'Nužna pohrana, sesija, privola i upravljanje u pregledniku.',
  },
];

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

function applyNicheDefaults(nicheId) {
  const item = templateForNiche(nicheId);
  const { recommendedIds } = palettesForNiche(nicheId);
  return {
    niche: nicheId,
    template: item.id,
    layout: item.layout,
    palette: recommendedIds[0] || item.palette,
    sections: { ...item.sections },
  };
}

const firstNiche = findSignupNiche('fitness');
const empty = {
  email: '',
  businessName: '',
  password: '',
  passwordAgain: '',
  acceptTerms: false,
  nicheCustom: '',
  ...applyNicheDefaults(firstNiche.id),
};

function ColorPicks({ value, onChange, palettes, label }) {
  const active = palettes.find((item) => item.id === value) || palettes[0];

  return (
    <div className="biz-color-picks">
      <div className="biz-color-picks__head">
        <div>
          <span className="biz-color-picks__eyebrow">Boja stranice</span>
          <p className="biz-color-picks__label">{label}</p>
        </div>
        {active ? (
          <span className="biz-color-picks__chosen" style={{ color: active.theme.primaryColor }}>
            {active.name}
          </span>
        ) : null}
      </div>

      <div className="biz-color-picks__grid" role="radiogroup" aria-label="Preporučene boje">
        {palettes.map((item) => {
          const selected = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-label={item.name}
              aria-checked={selected}
              className={selected ? 'biz-color-pick is-selected' : 'biz-color-pick'}
              onClick={() => onChange(item.id)}
              style={{ '--pick-primary': item.theme.primaryColor }}
            >
              <span
                className="biz-color-pick__stage"
                style={{ background: item.theme.canvas }}
              >
                <span
                  className="biz-color-pick__band"
                  style={{ background: item.theme.primaryColor }}
                />
                <span className="biz-color-pick__lines" aria-hidden="true">
                  <span style={{ background: item.theme.ink }} />
                  <span style={{ background: item.theme.secondaryColor }} />
                  <span style={{ background: item.theme.primaryColor }} />
                </span>
                {selected ? (
                  <span className="biz-color-pick__check" aria-hidden="true">✓</span>
                ) : null}
              </span>
              <span className="biz-color-pick__name">{item.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ColorRail({ value, onChange, palettes, recommendedIds }) {
  const railRef = useRef(null);
  const dragRef = useRef(null);
  const recommended = new Set(recommendedIds);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const active = rail.querySelector('.biz-chip.is-selected');
    if (!active) return;
    active.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [value, palettes]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    function onWheel(event) {
      if (rail.scrollWidth <= rail.clientWidth) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      rail.scrollLeft += delta;
    }

    function onPointerDown(event) {
      if (event.button !== 1) return;
      event.preventDefault();
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startScroll: rail.scrollLeft,
      };
      rail.classList.add('is-panning');
      rail.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      rail.scrollLeft = drag.startScroll - (event.clientX - drag.startX);
    }

    function endPan(event) {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      rail.classList.remove('is-panning');
      if (rail.hasPointerCapture(event.pointerId)) {
        rail.releasePointerCapture(event.pointerId);
      }
    }

    function onAuxClick(event) {
      if (event.button === 1) event.preventDefault();
    }

    rail.addEventListener('wheel', onWheel, { passive: false });
    rail.addEventListener('pointerdown', onPointerDown);
    rail.addEventListener('pointermove', onPointerMove);
    rail.addEventListener('pointerup', endPan);
    rail.addEventListener('pointercancel', endPan);
    rail.addEventListener('auxclick', onAuxClick);

    return () => {
      rail.removeEventListener('wheel', onWheel);
      rail.removeEventListener('pointerdown', onPointerDown);
      rail.removeEventListener('pointermove', onPointerMove);
      rail.removeEventListener('pointerup', endPan);
      rail.removeEventListener('pointercancel', endPan);
      rail.removeEventListener('auxclick', onAuxClick);
    };
  }, []);

  function shift(direction) {
    const rail = railRef.current;
    if (!rail) return;
    const step = Math.max(rail.clientWidth * 0.7, 180);
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  return (
    <div className="biz-rail-shell">
      <button
        type="button"
        className="biz-rail__nav biz-rail__nav--prev"
        aria-label="Prethodne boje"
        onClick={() => shift(-1)}
      >
        ‹
      </button>
      <div
        className="biz-rail"
        ref={railRef}
        role="radiogroup"
        aria-label="Boja stranice"
        title="Kotačić ili srednji gumb miša: skrolajte lijevo–desno"
      >
        {palettes.map((item) => {
          const isRecommended = recommended.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-label={isRecommended ? `${item.name}, preporučeno` : item.name}
              aria-checked={value === item.id}
              className={[
                'biz-chip',
                value === item.id ? 'is-selected' : '',
                isRecommended ? 'is-recommended' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange(item.id)}
              style={{ '--pick-primary': item.theme.primaryColor }}
            >
              <span
                className="biz-chip__stage"
                style={{ background: item.theme.canvas }}
              >
                <span
                  className="biz-chip__band"
                  style={{ background: item.theme.primaryColor }}
                />
                <span className="biz-chip__soft" style={{ background: item.theme.secondaryColor }} />
              </span>
              <span className="biz-chip__name">{item.name}</span>
              {isRecommended ? <span className="biz-chip__badge">Za vas</span> : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="biz-rail__nav biz-rail__nav--next"
        aria-label="Sljedeće boje"
        onClick={() => shift(1)}
      >
        ›
      </button>
    </div>
  );
}

function LayoutSketch({ id, primary, soft, canvas }) {
  const tint = {
    '--sketch-ink': primary || 'currentColor',
    '--sketch-soft': soft || 'color-mix(in srgb, currentColor 14%, transparent)',
    '--sketch-canvas': canvas || 'transparent',
  };

  if (id === 'sidebar') {
    return (
      <span className="biz-sketch biz-sketch--side" style={tint} aria-hidden="true">
        <span className="biz-sketch__bar" />
        <span className="biz-sketch__side" />
        <span className="biz-sketch__main" />
      </span>
    );
  }
  if (id === 'bar') {
    return (
      <span className="biz-sketch biz-sketch--bar" style={tint} aria-hidden="true">
        <span className="biz-sketch__bar" />
        <span className="biz-sketch__main" />
        <span className="biz-sketch__block" />
      </span>
    );
  }
  return (
    <span className="biz-sketch biz-sketch--banner" style={tint} aria-hidden="true">
      <span className="biz-sketch__hero" />
      <span className="biz-sketch__main" />
      <span className="biz-sketch__block" />
    </span>
  );
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
    problems.businessName = 'Upišite naziv poslovanja.';
  } else if (!previewSlug(values.businessName)) {
    problems.businessName = 'Naziv treba sadržavati barem jedno slovo ili broj.';
  }
  if (values.password.length < 8) {
    problems.password = 'Lozinka mora imati najmanje 8 znakova.';
  }
  if (!values.passwordAgain) {
    problems.passwordAgain = 'Potvrdite lozinku.';
  } else if (values.password !== values.passwordAgain) {
    problems.passwordAgain = 'Lozinke se ne podudaraju.';
  }
  if (!values.niche) {
    problems.niche = 'Odaberite vrstu poslovanja.';
  }
  if (values.niche === 'generic' && !values.nicheCustom.trim()) {
    problems.nicheCustom = 'Upišite čime se bavite.';
  }
  if (!values.acceptTerms) {
    problems.acceptTerms = 'Prihvatite pravila privatnosti i uvjete korištenja.';
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

function studioForLegal(values) {
  return {
    name: values.businessName.trim() || 'Studio',
    email: values.email.trim(),
    phone: '',
    address: '',
  };
}

export default function BusinessSignupForm({ className = '' }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(empty);
  const [problems, setProblems] = useState({});
  const [formError, setFormError] = useState('');
  const [token, setToken] = useState('');
  const [legal, setLegal] = useState({ privacy: '', terms: '', cookies: '' });
  const [legalTab, setLegalTab] = useState('privacy');
  const navigate = useNavigate();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [createTenant, { isLoading: isCreating }] = useCreateTenantMutation();
  const [recordConsent] = useRecordConsentMutation();
  const isLoading = isRegistering || isCreating;
  const slug = previewSlug(values.businessName);
  const chosen = findPalette(values.palette);
  const template = findTemplate(values.template);
  const layout = findLayout(values.layout);
  const nicheMeta = findSignupNiche(values.niche);
  const { recommendedIds, palettes } = palettesForNiche(values.niche);
  const recommendedPalettes = recommendedIds
    .map((id) => findPalette(id))
    .filter(Boolean);
  const orderedTemplates = [...siteTemplates].sort((a, b) => {
    const aMatch = a.niches.includes(values.niche) ? 0 : 1;
    const bMatch = b.niches.includes(values.niche) ? 0 : 1;
    return aMatch - bMatch;
  });
  const activeLegalTab = LEGAL_TABS.find((item) => item.id === legalTab) || LEGAL_TABS[0];
  const legalPreview = paragraphsFromLegal(legal[legalTab] || '').slice(0, 8);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
    setProblems((current) => ({ ...current, [field]: '' }));
    setFormError('');
  }

  function pickNiche(nicheId) {
    setValues((current) => ({
      ...current,
      ...applyNicheDefaults(nicheId),
      nicheCustom: nicheId === 'generic' ? current.nicheCustom : '',
    }));
    setProblems((current) => ({ ...current, niche: '', nicheCustom: '' }));
    setFormError('');
  }

  function pickTemplate(templateId) {
    const item = findTemplate(templateId);
    const nicheKey = values.niche || item.niches[0] || 'generic';
    const { recommendedIds: nextRecommended } = palettesForNiche(nicheKey);
    setValues((current) => ({
      ...current,
      template: item.id,
      layout: item.layout,
      palette: nextRecommended.includes(current.palette)
        ? current.palette
        : (nextRecommended[0] || item.palette),
      sections: { ...item.sections },
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

  function goLegal(event) {
    event.preventDefault();
    setFormError('');
    setLegal(generateAllStudioLegal(studioForLegal(values)));
    setLegalTab('privacy');
    setStep(2);
  }

  function refillLegal() {
    setLegal(generateAllStudioLegal(studioForLegal(values)));
    setFormError('');
  }

  function updateLegal(field, value) {
    setLegal((current) => ({ ...current, [field]: value }));
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

    const nextLegal = {
      privacy: legal.privacy.trim(),
      terms: legal.terms.trim(),
      cookies: legal.cookies.trim(),
    };
    if (!nextLegal.privacy || !nextLegal.terms || !nextLegal.cookies) {
      setFormError('Predlošci privatnosti, uvjeta i kolačića moraju biti ispunjeni.');
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
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          name: values.businessName.trim(),
          email: values.email.trim().toLowerCase(),
          role: 'BUSINESS_OWNER',
          detail: values.businessName.trim(),
        }));
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

      const nicheCustom = values.niche === 'generic' ? values.nicheCustom.trim() : '';
      const created = await createTenant({
        name: values.businessName.trim(),
        niche: values.niche,
        nicheCustom,
        email: values.email.trim(),
        timezone: 'Europe/Zagreb',
        template: template.id,
        layout: values.layout,
        paletteId: values.palette,
        visibleSections: values.sections,
        legal: nextLegal,
      }).unwrap();

      localStorage.setItem(TOKEN_KEY, accessToken);
      saveStudio({
        ...created.tenant,
        niche: values.niche,
        nicheCustom,
        template: template.id,
        layout: values.layout,
        palette: values.palette,
        sections: values.sections,
        siteSettings: {
          ...(created.tenant?.siteSettings || {}),
          legal: {
            ...nextLegal,
            updatedAt: created.tenant?.siteSettings?.legal?.updatedAt || new Date().toISOString(),
          },
        },
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
    <div
      className={`biz-form ${step >= 1 ? 'biz-form--atelier' : ''} ${className}`.trim()}
      id="otvorite"
    >
      <div className="biz-form__progress" aria-live="polite">
        <ol className="biz-form__steps">
          <li className={step === 0 ? 'is-active' : 'is-done'}>
            <span className="biz-form__step-no">01</span>
            <span className="biz-form__step-label">Račun</span>
          </li>
          <li className={step === 1 ? 'is-active' : step > 1 ? 'is-done' : ''}>
            <span className="biz-form__step-no">02</span>
            <span className="biz-form__step-label">Izgled</span>
          </li>
          <li className={step === 2 ? 'is-active' : ''}>
            <span className="biz-form__step-no">03</span>
            <span className="biz-form__step-label">Pravila</span>
          </li>
        </ol>
        <div
          className="biz-form__progress-track"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step + 1}
          aria-label={`Korak ${step + 1} od 3`}
        >
          <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
        </div>
      </div>

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
              placeholder="ime@studio.hr"
            />
            {problems.email ? <span className="biz-form__error">{problems.email}</span> : null}
          </label>

          <label>
            Naziv poslovanja
            <input
              name="organization"
              autoComplete="organization"
              value={values.businessName}
              onChange={(event) => update('businessName', event.target.value)}
              aria-invalid={Boolean(problems.businessName)}
              placeholder="npr. Studio Ravnoteža"
            />
            {slug ? (
              <span className="biz-form__slug">
                Vaša poveznica
                <strong>{studioHost(slug)}</strong>
              </span>
            ) : (
              <span className="biz-form__hint">
                Iz naziva nastaje poveznica za rezervacije koju dijelite klijentima.
              </span>
            )}
            {problems.businessName ? (
              <span className="biz-form__error">{problems.businessName}</span>
            ) : null}
          </label>

          <fieldset className="biz-niches">
            <legend>Vrsta poslovanja</legend>
            <p className="biz-form__hint">
              Odaberite nišu — od toga ovise predložak, raspored i preporučene boje.
            </p>
            <div className="biz-niches__grid" role="radiogroup" aria-label="Vrsta poslovanja">
              {signupNiches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={values.niche === item.id}
                  className={values.niche === item.id ? 'biz-niche is-selected' : 'biz-niche'}
                  onClick={() => pickNiche(item.id)}
                >
                  <span className="biz-niche__name">{item.name}</span>
                  <span className="biz-niche__note">{item.note}</span>
                </button>
              ))}
            </div>
            {problems.niche ? <span className="biz-form__error">{problems.niche}</span> : null}

            {values.niche === 'generic' ? (
              <label className="biz-niches__custom">
                Vaša niša
                <input
                  name="nicheCustom"
                  autoComplete="off"
                  placeholder="npr. keramičarska radionica, tečaj engleskog…"
                  value={values.nicheCustom}
                  onChange={(event) => update('nicheCustom', event.target.value)}
                  aria-invalid={Boolean(problems.nicheCustom)}
                />
                {problems.nicheCustom ? (
                  <span className="biz-form__error">{problems.nicheCustom}</span>
                ) : (
                  <span className="biz-form__hint">
                    Kratko opišite čime se bavite — spremamo to uz vaš račun.
                  </span>
                )}
              </label>
            ) : null}

            {values.niche ? (
              <ColorPicks
                value={values.palette}
                onChange={(palette) => update('palette', palette)}
                palettes={recommendedPalettes}
                label={
                  values.niche === 'generic'
                    ? 'Odaberite početnu boju (kasnije možete promijeniti).'
                    : `Pet preporuka za „${nicheMeta.name}”.`
                }
              />
            ) : null}
          </fieldset>

          <PasswordField
            label="Lozinka"
            name="password"
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            invalid={Boolean(problems.password)}
            error={problems.password}
          />

          <PasswordField
            label="Potvrdite lozinku"
            name="passwordAgain"
            value={values.passwordAgain}
            onChange={(event) => update('passwordAgain', event.target.value)}
            invalid={Boolean(problems.passwordAgain)}
            error={problems.passwordAgain}
          />

          <label className="biz-form__consent">
            <span className="biz-form__switch">
              <input
                type="checkbox"
                checked={values.acceptTerms}
                onChange={(event) => update('acceptTerms', event.target.checked)}
                aria-invalid={Boolean(problems.acceptTerms)}
              />
              <span aria-hidden="true" />
            </span>
            <span>
              Prihvaćam
              {' '}
              <Link to="/privatnost" target="_blank" rel="noreferrer">pravila privatnosti</Link>
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
            Nastavite
          </button>

          <p className="biz-form__login">
            Već imate račun? <Link to="/login">Prijavite se</Link>
          </p>
        </form>
      ) : null}

      {step === 1 ? (
        <form className="biz-form__panel biz-form__atelier" onSubmit={goLegal} noValidate>
          <div className="biz-form__atelier-main">
            <div className="biz-form__block">
              <div className="biz-form__block-title">
                <h3>Predložak</h3>
                <p className="biz-form__hint">
                  Predlošci za „{nicheMeta.name}” su prvi. Kasnije sve možete mijenjati.
                </p>
              </div>
              <div className="biz-templates" role="radiogroup" aria-label="Predložak stranice">
                {orderedTemplates.map((item) => {
                  const matched = item.niches.includes(values.niche);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={values.template === item.id}
                      className={values.template === item.id ? 'biz-template is-selected' : 'biz-template'}
                      onClick={() => pickTemplate(item.id)}
                    >
                      {matched ? <span className="biz-template__tag">Za vas</span> : null}
                      <LayoutSketch
                        id={item.layout}
                        primary={chosen.theme.primaryColor}
                        soft={chosen.theme.secondaryColor}
                        canvas={chosen.theme.canvas}
                      />
                      <span className="biz-template__name">{item.name}</span>
                      <span className="biz-template__note">{item.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="biz-form__block">
              <div className="biz-form__block-title">
                <h3>Raspored</h3>
                <p className="biz-form__hint">
                  Header je uvijek tu. Odaberite kako se sekcije slažu ispod njega.
                </p>
              </div>
              <div className="biz-layouts" role="radiogroup" aria-label="Raspored stranice">
                {pageLayouts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={values.layout === item.id}
                    className={values.layout === item.id ? 'biz-layout is-selected' : 'biz-layout'}
                    onClick={() => update('layout', item.id)}
                  >
                    <LayoutSketch
                      id={item.id}
                      primary={chosen.theme.primaryColor}
                      soft={chosen.theme.secondaryColor}
                      canvas={chosen.theme.canvas}
                    />
                    <span className="biz-layout__name">{item.name}</span>
                    <span className="biz-layout__note">{item.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="biz-form__block biz-form__block--colors">
              <div className="biz-form__block-head">
                <div className="biz-form__block-title">
                  <h3>Boja</h3>
                  <p className="biz-form__hint">
                    Prvih pet je usklađeno s „{nicheMeta.name}”. Ostale su dostupne u traci.
                  </p>
                </div>
                <span
                  className="biz-form__chosen-chip"
                  style={{ color: chosen.theme.primaryColor }}
                >
                  {chosen.name}
                </span>
              </div>
              <ColorRail
                value={values.palette}
                onChange={(palette) => update('palette', palette)}
                palettes={palettes}
                recommendedIds={recommendedIds}
              />
            </div>

            <div className="biz-form__actions">
              <button className="biz-form__back" type="button" onClick={() => setStep(0)}>
                Natrag
              </button>
              <button className="biz-form__submit" type="submit">
                Nastavite na pravila
              </button>
            </div>
          </div>

          <aside className="biz-form__atelier-stage" aria-label="Pregled stranice">
            <div className="biz-stage">
              <div className="biz-stage__mat" aria-hidden="true" />
              <div className="biz-stage__frame">
                <div className="biz-stage__top">
                  <span className="biz-stage__live">Uživo</span>
                  <span className="biz-stage__url">{studioHost(slug)}</span>
                </div>

                <article
                  className={`biz-preview biz-preview--${values.layout}`}
                  style={{
                    background: chosen.theme.canvas,
                    color: chosen.theme.ink,
                    fontFamily: chosen.theme.fontFamily,
                    '--preview-brand': chosen.theme.primaryColor,
                    '--preview-soft': chosen.theme.secondaryColor,
                    '--preview-on': chosen.theme.onPrimary,
                  }}
                >
                  {values.layout === 'sidebar' ? (
                    <aside className="biz-preview__rail" aria-hidden="true">
                      <span className="biz-preview__mark">
                        {(values.businessName.trim() || 'S').slice(0, 1).toUpperCase()}
                      </span>
                      <p className="biz-preview__rail-title">Kontakt</p>
                      <span className="biz-preview__rail-line" />
                      <span className="biz-preview__rail-line biz-preview__rail-line--short" />
                      <p className="biz-preview__rail-title">Radno vrijeme</p>
                      <ul className="biz-preview__hours">
                        <li><span>Pon–Pet</span><span>08–20</span></li>
                        <li><span>Sub</span><span>09–14</span></li>
                      </ul>
                    </aside>
                  ) : null}

                  <div className="biz-preview__main">
                    <div className={`biz-preview__hero${values.layout === 'bar' ? ' biz-preview__hero--bar' : ''}`}>
                      {values.layout === 'banner' ? (
                        <span className="biz-preview__wash" aria-hidden="true" />
                      ) : null}
                      <p className="biz-preview__kicker">{nicheMeta.name}</p>
                      <h4>{values.businessName.trim() || 'Vaš studio'}</h4>
                      <p className="biz-preview__lead">
                        Rezervacije online — bez poruka, bez čekanja na odgovor.
                      </p>
                      <span
                        className="biz-preview__cta"
                        style={{
                          background: chosen.theme.primaryColor,
                          color: chosen.theme.onPrimary,
                        }}
                      >
                        Odaberite termin
                      </span>
                    </div>

                    <div className="biz-preview__schedule" aria-hidden="true">
                      <div className="biz-preview__days">
                        {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((day, index) => (
                          <span
                            key={`${day}-${index}`}
                            className={index === 2 ? 'is-active' : undefined}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                      <div className="biz-preview__slots">
                        <div className="biz-preview__slot is-open">
                          <strong>09:00</strong>
                          <span>Slobodno</span>
                        </div>
                        <div className="biz-preview__slot">
                          <strong>11:30</strong>
                          <span>1 mjesto</span>
                        </div>
                        <div className="biz-preview__slot is-full">
                          <strong>17:00</strong>
                          <span>Popunjeno</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <div className="biz-stage__legend">
                  <span>{template.name}</span>
                  <span>{layout.name}</span>
                  <span>{chosen.name}</span>
                </div>
              </div>
            </div>
            <p className="biz-stage__caption">
              Ovako klijenti vide vašu poveznicu — predložak, raspored i boja mijenjaju pregled odmah.
            </p>
          </aside>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="biz-form__panel biz-form__atelier biz-form__atelier--legal" onSubmit={finish} noValidate>
          <div className="biz-form__atelier-main">
            <div className="biz-form__block">
              <div className="biz-form__block-title">
                <h3>Pravni predlošci</h3>
                <p className="biz-form__hint">
                  Odmah dobivate tekstove privatnosti, uvjeta i kolačića usklađene s tipičnim
                  zahtjevima GDPR-a i hrvatskih propisa. Vi ste voditelj obrade; anyminutes je
                  tehnička platforma. Predložak možete urediti sada ili kasnije u postavkama —
                  nije formalni pravni savjet.
                </p>
              </div>

              <div className="biz-legal-tabs" role="tablist" aria-label="Pravni dokumenti">
                {LEGAL_TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`biz-legal-tab-${item.id}`}
                    aria-selected={legalTab === item.id}
                    aria-controls={`biz-legal-panel-${item.id}`}
                    className={legalTab === item.id ? 'is-active' : undefined}
                    onClick={() => setLegalTab(item.id)}
                  >
                    <span className="biz-legal-tabs__no">{item.index}</span>
                    <span className="biz-legal-tabs__copy">
                      <strong>{item.label}</strong>
                      <em>{item.note}</em>
                    </span>
                  </button>
                ))}
              </div>

              <div
                className="biz-legal-editor"
                role="tabpanel"
                id={`biz-legal-panel-${activeLegalTab.id}`}
                aria-labelledby={`biz-legal-tab-${activeLegalTab.id}`}
              >
                <div className="biz-legal-editor__head">
                  <div>
                    <p className="biz-form__hint" style={{ margin: 0 }}>Predložak studija</p>
                    <h4>{activeLegalTab.title}</h4>
                  </div>
                  <button className="biz-form__back" type="button" onClick={refillLegal}>
                    Vrati predložak
                  </button>
                </div>
                <label className="biz-legal-editor__field">
                  <span className="visually-hidden">{activeLegalTab.title}</span>
                  <textarea
                    rows={14}
                    value={legal[legalTab]}
                    onChange={(event) => updateLegal(legalTab, event.target.value)}
                    spellCheck="true"
                  />
                </label>
              </div>
            </div>

            {formError ? <p className="biz-form__form-error">{formError}</p> : null}

            <div className="biz-form__actions">
              <button className="biz-form__back" type="button" onClick={() => setStep(1)}>
                Natrag
              </button>
              <button className="biz-form__submit" type="submit" disabled={isLoading}>
                {isLoading ? 'Otvaramo rezervacijsku stranicu…' : 'Otvorite rezervacijsku stranicu'}
              </button>
            </div>
          </div>

          <aside className="biz-form__atelier-stage" aria-label="Pregled pravila">
            <div className="biz-stage">
              <div className="biz-stage__mat" aria-hidden="true" />
              <div className="biz-stage__frame">
                <div className="biz-stage__top">
                  <span className="biz-stage__live">Dokument</span>
                  <span className="biz-stage__url">
                    /s/
                    {slug || 'studio'}
                    /
                    {legalTab === 'privacy' ? 'privatnost' : legalTab === 'terms' ? 'uvjeti' : 'kolacici'}
                  </span>
                </div>
                <article className="biz-legal-preview">
                  <p className="biz-legal-preview__kicker">
                    {activeLegalTab.index}
                    {' · '}
                    {activeLegalTab.label}
                  </p>
                  <h4>{values.businessName.trim() || 'Vaš studio'}</h4>
                  <div className="biz-legal-preview__body">
                    {legalPreview.length > 0 ? (
                      legalPreview.map((line, index) => (
                        index === 0
                          ? <p key={`lp-${index}`} className="biz-legal-preview__title">{line}</p>
                          : <p key={`lp-${index}`}>{line}</p>
                      ))
                    ) : (
                      <p>Upišite ili vratite predložak da vidite pregled.</p>
                    )}
                  </div>
                </article>
                <div className="biz-stage__legend">
                  <span>Privatnost</span>
                  <span>Uvjeti</span>
                  <span>Kolačići</span>
                </div>
              </div>
            </div>
            <p className="biz-stage__caption">
              Ovi tekstovi idu na vašu stranicu odmah. Pravila anyminutesa ostaju odvojena
              na platformi.
            </p>
          </aside>
        </form>
      ) : null}
    </div>
  );
}
