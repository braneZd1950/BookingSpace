import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateTenantMutation, useRegisterMutation } from '../../api/authApi.js';
import { useRecordConsentMutation } from '../../api/consentApi.js';
import PasswordField from '../../components/PasswordField.jsx';
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
import { isEmail } from '../../lib/isEmail.js';

const LEGAL_TABS = [
  {
    id: 'privacy',
    index: '01',
    icon: 'privacy',
    label: 'Privatnost',
    title: 'Politika privatnosti',
    note: 'Odgovornost poslovanja · podaci njegovih klijenata',
    role: 'Voditelj obrade: vaše poslovanje.',
  },
  {
    id: 'terms',
    index: '02',
    icon: 'terms',
    label: 'Uvjeti',
    title: 'Uvjeti poslovanja i rezervacija',
    note: 'Cijene, rezervacije, otkazivanja, članarine i povrati',
    role: 'Odgovornost: vaše poslovanje.',
  },
  {
    id: 'cookies',
    index: '03',
    icon: 'cookies',
    label: 'Kolačići',
    title: 'Politika kolačića',
    note: 'Stvarno korišteni kolačići i tehnologije na njegovoj stranici',
    role: 'Odgovornost ovisi o tome tko određuje svrhe i sredstva.',
  },
];

const PLATFORM_LEGAL_DOCS = [
  {
    id: 'platform-privacy',
    icon: 'privacy',
    title: 'Politika privatnosti Blizarija',
    note: 'Poslovni računi, korisnici platforme, sigurnost i naplata',
    to: '/privatnost',
  },
  {
    id: 'platform-terms',
    icon: 'terms',
    title: 'Uvjeti korištenja Blizarija',
    note: 'Odnos platforme s poslovnim korisnicima i klijentima',
    to: '/uvjeti',
  },
  {
    id: 'platform-cookies',
    icon: 'cookies',
    title: 'Politika kolačića Blizarija',
    note: 'Kolačići na glavnoj platformi i njezinim stranicama',
    to: '/kolacici',
  },
  {
    id: 'platform-dpa',
    icon: 'dpa',
    title: 'Ugovor o obradi podataka (DPA)',
    note: 'Odnos Blizarija i poslovanja prema čl. 28. GDPR-a',
    to: null,
  },
];

function LegalDocIcon({ type }) {
  const common = {
    className: 'biz-legal-icon',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  };

  if (type === 'terms') {
    return (
      <svg {...common}>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 4.5h7.2L18 8.3V19.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M14 4.6V8.5h3.8M9 12h6M9 15.5h6" />
      </svg>
    );
  }

  if (type === 'cookies') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="9.2" cy="10.2" r="1.05" fill="currentColor" />
        <circle cx="13.6" cy="9.4" r="0.9" fill="currentColor" />
        <circle cx="11.2" cy="14.2" r="1.05" fill="currentColor" />
        <circle cx="15" cy="13.6" r="0.85" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'dpa') {
    return (
      <svg {...common}>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7.5h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M9.5 11.2h5M9.5 14h3.5" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M10 5.5h4" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.8 5.8 6.4v4.3c0 4.1 2.7 7.1 6.2 8.5 3.5-1.4 6.2-4.4 6.2-8.5V6.4L12 3.8Z"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M9.4 12.1 11.1 13.8 14.7 10" />
    </svg>
  );
}

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

function NicheIcon({ id }) {
  if (id === 'fitness') {
    return (
      <svg className="biz-niche__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M4 9v6M7 7v10M10 10v4M14 10v4M17 7v10M20 9v6"
        />
      </svg>
    );
  }
  if (id === 'services') {
    return (
      <svg className="biz-niche__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          d="M5.5 19c1.2-3.2 3.4-4.8 6.5-4.8S17.3 15.8 18.5 19"
        />
      </svg>
    );
  }
  if (id === 'playroom') {
    return (
      <svg className="biz-niche__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="4" y="7" width="16" height="12" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M8 7V5.5M16 7V5.5M4 12h16" />
      </svg>
    );
  }
  return (
    <svg className="biz-niche__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

function ColorPicks({
  value,
  onChange,
  palettes,
  label,
  businessName = '',
  nicheName = '',
}) {
  const active = palettes.find((item) => item.id === value) || palettes[0];
  const previewName = businessName.trim() || 'Vaše poslovanje';

  return (
    <div className="biz-color-picks">
      <div className="biz-color-picks__head">
        <div>
          <span className="biz-color-picks__eyebrow">Boja stranice</span>
          <p className="biz-color-picks__label">{label}</p>
        </div>
        {active ? (
          <span className="biz-color-picks__chosen" style={{ color: active.theme.primaryColor }}>
            <span
              className="biz-color-picks__chosen-dot"
              style={{ background: active.theme.primaryColor }}
              aria-hidden="true"
            />
            {active.name}
          </span>
        ) : null}
      </div>

      {active ? (
        <div
          className="biz-color-picks__preview"
          aria-label="Pregled boje na stranici"
          style={{
            background: active.theme.canvas,
            color: active.theme.ink,
            '--pick-primary': active.theme.primaryColor,
            '--pick-soft': active.theme.secondaryColor,
          }}
        >
          <span className="biz-color-picks__preview-kicker">
            {nicheName || 'Vaša stranica'}
          </span>
          <strong>{previewName}</strong>
          <span className="biz-color-picks__preview-cta" style={{ background: active.theme.primaryColor }}>
            Odaberite termin
          </span>
        </div>
      ) : null}

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
              title={item.name}
              className={selected ? 'biz-swatch is-selected' : 'biz-swatch'}
              onClick={() => onChange(item.id)}
              style={{ '--pick-primary': item.theme.primaryColor }}
            >
              <span
                className="biz-swatch__dot"
                style={{ background: item.theme.primaryColor }}
              >
                {selected ? (
                  <span className="biz-swatch__check" aria-hidden="true">✓</span>
                ) : null}
              </span>
              <span className="biz-swatch__name">{item.name}</span>
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
              title={item.name}
            >
              <span
                className="biz-swatch__dot biz-chip__dot"
                style={{ background: item.theme.primaryColor }}
              >
                {value === item.id ? (
                  <span className="biz-swatch__check" aria-hidden="true">✓</span>
                ) : null}
              </span>
              <span className="biz-swatch__name">{item.name}</span>
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
        <span className="biz-sketch__side">
          <i /><i /><i />
        </span>
        <span className="biz-sketch__main">
          <i className="biz-sketch__title" />
          <i /><i className="biz-sketch__cta" />
        </span>
      </span>
    );
  }
  if (id === 'bar') {
    return (
      <span className="biz-sketch biz-sketch--bar" style={tint} aria-hidden="true">
        <span className="biz-sketch__bar" />
        <span className="biz-sketch__main">
          <i className="biz-sketch__title" />
          <i /><i /><i className="biz-sketch__cta" />
        </span>
        <span className="biz-sketch__block">
          <i /><i />
        </span>
      </span>
    );
  }
  return (
    <span className="biz-sketch biz-sketch--banner" style={tint} aria-hidden="true">
      <span className="biz-sketch__hero">
        <i className="biz-sketch__title" />
        <i className="biz-sketch__cta" />
      </span>
      <span className="biz-sketch__main">
        <i /><i /><i />
      </span>
      <span className="biz-sketch__block">
        <i /><i />
      </span>
    </span>
  );
}

function basicsProblems(values) {
  const problems = {};
  if (!isEmail(values.email.trim())) {
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
    setValues((current) => ({
      ...current,
      template: item.id,
      layout: item.layout,
      palette: item.palette,
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
        setProblems({ businessName: 'Iz ovog naziva ne nastaje valjana poveznica. Promijenite naziv.' });
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
            <span className="biz-form__step-label">Izgled stranice</span>
          </li>
          <li className={step === 2 ? 'is-active' : ''}>
            <span className="biz-form__step-no">03</span>
            <span className="biz-form__step-label">Pravila i privatnost</span>
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
          <header className="biz-form__section-head">
            <h2 className="biz-form__section-title">Podaci o poslovanju</h2>
          </header>

          <label>
            E-pošta
            <input
              name="email"
              type="email"
              autoComplete="email"
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
                Poveznica za rezervacije
                <strong>{studioHost(slug)}</strong>
              </span>
            ) : (
              <span className="biz-form__hint">
                Naziv vašeg poslovanja koristit će se za izradu poveznice koju ćete
                dijeliti sa svojim klijentima.
              </span>
            )}
            {problems.businessName ? (
              <span className="biz-form__error">{problems.businessName}</span>
            ) : null}
          </label>

          <fieldset className="biz-niches">
            <legend>Vrsta poslovanja</legend>
            <p className="biz-form__hint">
              Odaberite djelatnost koja najbolje opisuje vaš posao. Na temelju
              odabira prilagodit ćemo početni izgled stranice i preporučiti
              odgovarajući raspored.
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
                  <span className="biz-niche__top">
                    <NicheIcon id={item.id} />
                    <span className="biz-niche__name">{item.name}</span>
                  </span>
                  <span className="biz-niche__note">{item.note}</span>
                </button>
              ))}
            </div>
            {problems.niche ? <span className="biz-form__error">{problems.niche}</span> : null}

            {values.niche === 'generic' ? (
              <label className="biz-niches__custom">
                Opišite svoje poslovanje
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
                    U nekoliko riječi opišite čime se bavite. Ovaj opis spremit ćemo
                    uz podatke vašeg poslovanja.
                  </span>
                )}
              </label>
            ) : null}

            {values.niche ? (
              <ColorPicks
                value={values.palette}
                onChange={(palette) => update('palette', palette)}
                palettes={recommendedPalettes}
                businessName={values.businessName}
                nicheName={nicheMeta.name}
                label="Odaberite početnu boju koja najbolje odgovara vašem poslovanju. Izgled možete promijeniti u bilo kojem trenutku."
              />
            ) : null}
          </fieldset>

          <header className="biz-form__section-head">
            <h2 className="biz-form__section-title">Zaštitite svoj račun</h2>
          </header>

          <PasswordField
            label="Lozinka"
            className="biz-form__password"
            wrapClassName="biz-form__password-wrap"
            buttonClassName="biz-form__eye"
            name="password"
            value={values.password}
            onChange={(event) => update('password', event.target.value)}
            invalid={Boolean(problems.password)}
            error={problems.password}
          />

          <PasswordField
            label="Potvrdite lozinku"
            className="biz-form__password"
            wrapClassName="biz-form__password-wrap"
            buttonClassName="biz-form__eye"
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
              <Link to="/privatnost" target="_blank" rel="noreferrer">Obavijest o privatnosti</Link>
              {' '}
              i
              {' '}
              <Link to="/uvjeti" target="_blank" rel="noreferrer">Uvjete korištenja</Link>
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
            <header className="biz-form__atelier-intro">
              <p className="biz-form__kicker">
                Korak 02 · Izgled stranice · {nicheMeta.name}
              </p>
              <h2 className="biz-form__atelier-title">Uredite izgled svoje stranice</h2>
              <p className="biz-form__hint">
                Odaberite izgled koji najbolje odgovara vašem poslovanju. Odaberite
                predložak, raspored i boju te odmah pogledajte kako će vaša stranica
                izgledati klijentima. Sve možete promijeniti i kasnije.
              </p>
            </header>

            <div className="biz-form__block">
              <div className="biz-form__block-title">
                <h3>Predložak</h3>
                <p className="biz-form__hint">
                  Odaberite stil koji najbolje odgovara vašoj djelatnosti.
                  Preporučili smo vam predloške prema vrsti poslovanja, ali možete
                  odabrati bilo koji.
                </p>
              </div>
              <div className="biz-templates" role="radiogroup" aria-label="Predložak stranice">
                {orderedTemplates.map((item) => {
                  const matched = item.niches.includes(values.niche);
                  const itemPalette = findPalette(item.palette);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={values.template === item.id}
                      className={values.template === item.id ? 'biz-template is-selected' : 'biz-template'}
                      onClick={() => pickTemplate(item.id)}
                    >
                      {matched ? (
                        <span className="biz-template__tag">Preporučeno</span>
                      ) : null}
                      <LayoutSketch
                        id={item.layout}
                        primary={
                          values.template === item.id
                            ? chosen.theme.primaryColor
                            : itemPalette.theme.primaryColor
                        }
                        soft={
                          values.template === item.id
                            ? chosen.theme.secondaryColor
                            : itemPalette.theme.secondaryColor
                        }
                        canvas={
                          values.template === item.id
                            ? chosen.theme.canvas
                            : itemPalette.theme.canvas
                        }
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
                  Odaberite kako će informacije, radno vrijeme, usluge i termini biti
                  raspoređeni na vašoj stranici.
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
                  <h3>Boja stranice</h3>
                  <p className="biz-form__hint">
                    Odaberite boju koja najbolje odgovara vašem poslovanju.
                    Promjena boje odmah će se prikazati u pregledu stranice.
                  </p>
                </div>
                <span
                  className="biz-form__chosen-chip"
                  style={{ color: chosen.theme.primaryColor }}
                >
                  <span
                    className="biz-color-picks__chosen-dot"
                    style={{ background: chosen.theme.primaryColor }}
                    aria-hidden="true"
                  />
                  Odabrana boja:
                  {' '}
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
          </div>

          <aside className="biz-form__atelier-stage" aria-label="Pregled vaše stranice">
            <div className="biz-stage">
              <div className="biz-stage__mat" aria-hidden="true" />
              <div className="biz-stage__frame">
                <div className="biz-stage__top">
                  <span className="biz-stage__live">Pregled za klijente</span>
                  <span className="biz-stage__url">
                    {studioHost(slug)}
                  </span>
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
                      <h4>{values.businessName.trim() || 'Vaše poslovanje'}</h4>
                      <p className="biz-preview__lead">
                        Rezervirajte svoj termin jednostavno i brzo – bez poruka i
                        čekanja na odgovor.
                      </p>
                      <span
                        className="biz-preview__cta"
                        style={{
                          background: chosen.theme.primaryColor,
                          color: chosen.theme.onPrimary,
                        }}
                      >
                        Odaberite uslugu i termin
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
              Ovako će vaša stranica izgledati kada je podijelite s klijentima.
            </p>
          </aside>

          <div className="biz-form__actions biz-form__actions--atelier">
            <button className="biz-form__back" type="button" onClick={() => setStep(0)}>
              ← Natrag
            </button>
            <button
              className="biz-form__skip"
              type="button"
              onClick={goLegal}
            >
              Preskoči za sada
            </button>
            <button className="biz-form__submit" type="submit">
              Nastavi
            </button>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form className="biz-form__panel biz-form__atelier biz-form__atelier--legal" onSubmit={finish} noValidate>
          <div className="biz-form__atelier-main">
            <div className="biz-form__block">
              <div className="biz-form__block-title">
                <p className="biz-legal-kicker">Pravila i privatnost</p>
                <h3>Vaše poslovanje. Vaša pravila.</h3>
                <p className="biz-form__hint">
                  Svako poslovanje ima svoje usluge, klijente i način rada. Zato vam Blizari
                  omogućuje da postavite vlastite informacije o privatnosti, uvjete pružanja
                  usluga i pravila rezervacija.
                </p>
                <p className="biz-form__hint">
                  Dobit ćete prilagodljive predloške koje možete urediti prema stvarnom načinu
                  poslovanja. Dokumente možete dopuniti i kasnije u postavkama.
                </p>
                <p className="biz-legal-callout">
                  <strong>Važno:</strong>
                  {' '}
                  Vi ste odgovorni za usluge koje pružate svojim klijentima i za pravila koja
                  određujete. Blizari pruža tehničku platformu za upravljanje poslovanjem i
                  rezervacijama. Predlošci nisu gotovi pravno usklađeni dokumenti ni pravni savjet.
                </p>
              </div>

              <div className="biz-legal-section">
                <h4 className="biz-legal-section__title">Dokumenti vašeg poslovanja</h4>
                <p className="biz-form__hint">
                  Objavljuju se na stranici vašeg poslovanja. Upišite stvarne podatke subjekta
                  (naziv, adresa, OIB ako je primjenjivo) — sam naziv stranice nije dovoljan.
                </p>

                <div className="biz-legal-tabs" role="tablist" aria-label="Dokumenti poslovanja">
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
                      <span className="biz-legal-tabs__icon" aria-hidden="true">
                        <LegalDocIcon type={item.icon} />
                      </span>
                      <span className="biz-legal-tabs__copy">
                        <span className="biz-legal-tabs__index">{item.index}</span>
                        <strong>
                          {item.title}
                          {' '}
                          {values.businessName.trim() || 'vašeg poslovanja'}
                        </strong>
                        <em>{item.note}</em>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="biz-legal-editor"
                role="tabpanel"
                id={`biz-legal-panel-${activeLegalTab.id}`}
                aria-labelledby={`biz-legal-tab-${activeLegalTab.id}`}
              >
                <div className="biz-legal-editor__head">
                  <div>
                    <p className="biz-form__hint" style={{ margin: 0 }}>
                      {activeLegalTab.role}
                    </p>
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

              <div className="biz-legal-relation" aria-label="Odnos poslovanja i Blizarija">
                <h4 className="biz-legal-section__title">Odnos vašeg poslovanja i Blizarija</h4>
                <div className="biz-legal-relation__grid">
                  <article className="biz-legal-relation__card">
                    <span className="biz-legal-tabs__icon" aria-hidden="true">
                      <LegalDocIcon type="terms" />
                    </span>
                    <div>
                      <strong>Vaše poslovanje</strong>
                      <p>
                        Samostalno pružate usluge, upravljate rezervacijama, određujete cijene
                        i komunicirate sa svojim klijentima. Za obradu njihovih podataka u svrhu
                        pružanja usluga odgovorni ste kao voditelj obrade.
                      </p>
                    </div>
                  </article>
                  <article className="biz-legal-relation__card">
                    <span className="biz-legal-tabs__icon" aria-hidden="true">
                      <LegalDocIcon type="privacy" />
                    </span>
                    <div>
                      <strong>Blizari</strong>
                      <p>
                        Pruža tehničku platformu za predstavljanje usluga, primanje rezervacija
                        i upravljanje poslovanjem. Kada obrađuje podatke vaših klijenata prema
                        vašim uputama, djeluje kao izvršitelj obrade. Zasebno obrađuje podatke
                        poslovnih korisnika radi računa, naplate i sigurnosti.
                      </p>
                    </div>
                  </article>
                </div>
                <p className="biz-legal-relation__footnote">
                  Vaši dokumenti uređuju odnos s vašim klijentima. Dokumenti Blizarija uređuju
                  odnos s platformom.
                </p>
              </div>

              <div className="biz-legal-section">
                <h4 className="biz-legal-section__title">Dokumenti Blizarija</h4>
                <p className="biz-form__hint">
                  Objavljuju se na glavnoj platformi i odvojeni su od dokumenata vašeg poslovanja.
                </p>
                <ul className="biz-legal-platform">
                  {PLATFORM_LEGAL_DOCS.map((item) => (
                    <li key={item.id}>
                      {item.to ? (
                        <Link to={item.to} target="_blank" rel="noreferrer" className="biz-legal-platform__item">
                          <span className="biz-legal-tabs__icon" aria-hidden="true">
                            <LegalDocIcon type={item.icon} />
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <em>{item.note}</em>
                          </span>
                        </Link>
                      ) : (
                        <div className="biz-legal-platform__item is-static">
                          <span className="biz-legal-tabs__icon" aria-hidden="true">
                            <LegalDocIcon type={item.icon} />
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <em>
                              {item.note}
                              {' · '}
                              bit će dostupan uz prihvaćanje ugovora o korištenju platforme.
                            </em>
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {formError ? <p className="biz-form__form-error">{formError}</p> : null}

            <div className="biz-form__actions">
              <button className="biz-form__back" type="button" onClick={() => setStep(1)}>
                Natrag
              </button>
              <button className="biz-form__submit" type="submit" disabled={isLoading}>
                {isLoading ? 'Postavljamo vaše poslovanje…' : 'Postavite svoje poslovanje'}
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
                    <span className="biz-legal-preview__icon" aria-hidden="true">
                      <LegalDocIcon type={activeLegalTab.icon} />
                    </span>
                    {activeLegalTab.index}
                    {' · '}
                    {activeLegalTab.label}
                  </p>
                  <h4>{values.businessName.trim() || 'Vaše poslovanje'}</h4>
                  <p className="biz-legal-preview__note">{activeLegalTab.note}</p>
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
              Dokumenti poslovanja idu na vašu stranicu. Pravila Blizarija ostaju odvojena
              na platformi.
            </p>
          </aside>
        </form>
      ) : null}
    </div>
  );
}
