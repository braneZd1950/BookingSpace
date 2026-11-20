import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  useLazyMyTenantsQuery,
  useUpdateSiteMutation,
  useUpdateTenantMutation,
  useUploadImageMutation,
} from '../../api/tenantApi.js';
import { loadStudio, mediaUrl, saveStudio } from '../../lib/studio.js';
import { findLayout, pageLayouts } from './layouts.js';
import { findPalette, palettesForNiche, themePayload } from '../../styles/studioPalette.js';
import SiteFrame, { frameSources } from './SiteFrame.jsx';
import {
  findTemplate,
  nicheFromTemplate,
  siteTemplates,
  studioHost,
  templateForNiche,
} from './siteTemplates.js';
import TimeSelect from './TimeSelect.jsx';
import {
  copyWeekdayHours,
  fallbackHours,
  hourRows,
  hoursPayload,
  studioHours,
} from './studioTime.js';
import './SetupPage.scss';
import { isEmail } from '../../lib/isEmail.js';

const REAL_ID = /^[a-f\d]{24}$/i;
const DESCRIPTION_MAX = 500;
const DESCRIPTION_EXAMPLE = 'Dobro došli! Nudimo usluge, stručne savjete i ugodnu atmosferu prilagođenu vašim ciljevima.';

const defaultSections = {
  hero: true,
  about: true,
  services: true,
  schedule: true,
  gallery: false,
  contact: true,
  location: true,
  openingHours: true,
};

const sectionFields = [
  {
    key: 'hero',
    icon: 'hero',
    label: 'Naslovnica',
    note: 'Uvodni prikaz vašeg poslovanja.',
  },
  {
    key: 'about',
    icon: 'about',
    label: 'O poslovanju',
    note: 'Opis vašeg poslovanja i usluga.',
  },
  {
    key: 'services',
    icon: 'services',
    label: 'Usluge i aktivnosti',
    note: 'Popis onoga što klijenti mogu rezervirati ili koristiti.',
  },
  {
    key: 'contact',
    icon: 'contact',
    label: 'Kontakt',
    note: 'Broj telefona i e-mail adresa.',
  },
  {
    key: 'location',
    icon: 'location',
    label: 'Lokacija',
    note: 'Adresa na kojoj se nalazite.',
  },
  {
    key: 'openingHours',
    icon: 'hours',
    label: 'Radno vrijeme',
    note: 'Dani i sati u kojima poslujete.',
  },
];

function draftFrom(studio) {
  const suggested = templateForNiche(studio.niche);
  const template = findTemplate(studio.template || suggested.id);
  return {
    description: studio.description || '',
    phone: studio.phone || '',
    email: studio.email || '',
    address: studio.address || '',
    city: studio.city || '',
    mapsUrl: studio.mapsUrl || '',
    hours: studioHours(studio),
    sections: {
      ...defaultSections,
      ...studio.sections,
      services: true,
      schedule: true,
    },
    template: template.id,
    palette: findPalette(studio.palette || template.palette).id,
    layout: findLayout(studio.layout || template.layout).id,
    heroImageUrl: studio.heroImageUrl || '',
    logoUrl: studio.logoUrl || '',
  };
}

function isMapsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function problemsFor(draft) {
  const problems = {};
  const description = String(draft.description || '').trim();
  const email = String(draft.email || '').trim();
  const mapsUrl = String(draft.mapsUrl || '').trim();
  if (!description) problems.description = 'Ukratko predstavite svoje poslovanje.';
  else if (description.length > DESCRIPTION_MAX) {
    problems.description = `Opis može imati najviše ${DESCRIPTION_MAX} znakova.`;
  }
  if (email && !isEmail(email)) {
    problems.email = 'Upišite ispravnu e-poštu.';
  }
  if (mapsUrl && !isMapsUrl(mapsUrl)) {
    problems.mapsUrl = 'Upišite ispravnu poveznicu (https://…).';
  }
  const hoursWrong = hourRows.some(([key]) => {
    const row = draft.hours?.[key] || fallbackHours[key];
    return row?.works && row.from >= row.to;
  });
  if (hoursWrong) problems.hours = 'Zatvaranje treba biti nakon otvaranja.';
  return problems;
}

function SetupSectionIcon({ type }) {
  const common = {
    className: 'setup__icon',
    viewBox: '0 0 24 24',
    'aria-hidden': 'true',
    focusable: 'false',
  };

  if (type === 'schedule') {
    return (
      <svg {...common}>
        <rect x="4.5" y="5.5" width="15" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M8 3.8v3.2M16 3.8v3.2M4.5 10h15" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M8.2 13.5h3M8.2 16.2h7.2" />
      </svg>
    );
  }

  if (type === 'services') {
    return (
      <svg {...common}>
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M6 7.5h12M6 12h12M6 16.5h8" />
      </svg>
    );
  }

  if (type === 'hero') {
    return (
      <svg {...common}>
        <rect x="3.8" y="5.2" width="16.4" height="13.6" rx="2.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M3.8 14.2 8.4 10.8 12.2 14.1 15.1 11.8 20.2 16" />
        <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  if (type === 'location') {
    return (
      <svg {...common}>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 20s5.8-5.1 5.8-9.2A5.8 5.8 0 0 0 12 5a5.8 5.8 0 0 0-5.8 5.8C6.2 14.9 12 20 12 20Z"
        />
        <circle cx="12" cy="10.8" r="1.8" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  if (type === 'contact') {
    return (
      <svg {...common}>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 5.5h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M9.2 9.2h5.6M9.2 12.2h5.6M9.2 15.2h3.2" />
      </svg>
    );
  }

  if (type === 'hours') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d="M12 8.2v4.2l2.6 1.5" />
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
        d="M12 4.8 4.8 8.2v3.6c0 4.2 2.9 7.3 7.2 8.6 4.3-1.3 7.2-4.4 7.2-8.6V8.2L12 4.8Z"
      />
    </svg>
  );
}

function present(body) {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== ''));
}

function LayoutSketch({ id }) {
  if (id === 'sidebar') {
    return (
      <span className="sketch sketch--side" aria-hidden="true">
        <span className="sketch__bar">Header</span>
        <span className="sketch__side">Stupac</span>
        <span className="sketch__main">Termini</span>
      </span>
    );
  }
  if (id === 'bar') {
    return (
      <span className="sketch sketch--bar" aria-hidden="true">
        <span className="sketch__bar">Header</span>
        <span className="sketch__main">Termini</span>
        <span className="sketch__block">Kontakt</span>
      </span>
    );
  }
  return (
    <span className="sketch sketch--banner" aria-hidden="true">
      <span className="sketch__hero">Header</span>
      <span className="sketch__main">Termini</span>
      <span className="sketch__block">Kontakt</span>
    </span>
  );
}

export default function SetupPage() {
  const location = useLocation();
  const studio = useState(() => loadStudio())[0];
  const [step, setStep] = useState(() => {
    const requested = location.state?.step;
    if (Number.isInteger(requested)) return requested;
    return loadStudio()?.guideDone ? 5 : 0;
  });
  const [draft, setDraft] = useState(() => (studio ? draftFrom(studio) : null));
  const [problems, setProblems] = useState({});
  const [formError, setFormError] = useState('');
  const [openClock, setOpenClock] = useState('');
  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const navigate = useNavigate();
  const [updateTenant, { isLoading: savingTenant }] = useUpdateTenantMutation();
  const [updateSite, { isLoading: savingSite }] = useUpdateSiteMutation();
  const [uploadImage, { isLoading: savingImage }] = useUploadImageMutation();
  const [loadMine] = useLazyMyTenantsQuery();
  const saving = savingTenant || savingSite || savingImage;

  if (!studio || !draft) {
    return (
      <main className="setup">
        <h1>Prvo otvorite studio.</h1>
        <p className="setup__lead">Registrirajte poslovanje, pa složite stranicu.</p>
        <Link className="setup__submit" to="/register">Otvorite poslovanje</Link>
      </main>
    );
  }

  const hostname = studioHost(studio.slug);
  const chosen = findPalette(draft.palette);
  const { recommendedIds, palettes } = palettesForNiche(nicheFromTemplate(draft.template));
  const previewStyle = {
    background: chosen.theme.canvas,
    color: chosen.theme.ink,
    fontFamily: chosen.theme.fontFamily,
    '--preview-brand': chosen.theme.primaryColor,
    '--preview-on': chosen.theme.onPrimary,
    '--preview-radius': chosen.theme.borderRadius,
  };

  function change(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setProblems((current) => ({ ...current, [field]: '' }));
    setFormError('');
  }

  function pickTemplate(templateId) {
    const item = findTemplate(templateId);
    const { recommendedIds: nextRecommended } = palettesForNiche(item.niches[0] || 'generic');
    setDraft((current) => ({
      ...current,
      template: item.id,
      layout: item.layout,
      palette: nextRecommended[0] || item.palette,
    }));
    setFormError('');
  }

  function changeHours(key, patch) {
    setDraft((current) => ({
      ...current,
      hours: {
        ...current.hours,
        [key]: { ...(current.hours[key] || fallbackHours[key]), ...patch },
      },
    }));
    setProblems((current) => ({ ...current, hours: '' }));
  }

  function copyHoursAcrossWeekdays() {
    setDraft((current) => ({
      ...current,
      hours: copyWeekdayHours(current.hours),
    }));
    setProblems((current) => ({ ...current, hours: '' }));
  }

  function changeDescription(value) {
    change('description', value.slice(0, DESCRIPTION_MAX));
  }

  function changeSection(key, value) {
    if (key === 'schedule') return;
    setDraft((current) => ({
      ...current,
      sections: {
        ...current.sections,
        [key]: value,
        schedule: true,
      },
    }));
  }

  function keep(nextStep) {
    saveStudio({ ...studio, ...draft });
    setStep(nextStep);
  }

  function nextFromText(event) {
    event.preventDefault();
    const nextProblems = problemsFor(draft);
    setProblems(nextProblems);
    if (Object.keys(nextProblems).length > 0) return;
    keep(3);
  }

  function readImage(file, setFile, setPreview) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Slika treba biti JPG, PNG ili WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Slika je veća od 5 MB.');
      return;
    }
    setFormError('');
    setFile(file);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  function saveMessage(error) {
    if (error?.status === 'FETCH_ERROR') {
      return 'Poslužitelj nije dostupan. Stranica nije spremljena u bazu.';
    }
    if (error?.status === 401) return 'Prijavite se pa spremite stranicu.';
    if (error?.data?.code === 'PAYLOAD_TOO_LARGE') return 'Slika je veća od 5 MB.';
    if (error?.data?.code === 'UNSUPPORTED_MEDIA') return 'Slika treba biti JPG, PNG ili WebP.';
    return 'Stranica nije spremljena. Pokušajte ponovno.';
  }

  async function resolveId() {
    if (REAL_ID.test(String(studio.id || ''))) return String(studio.id);
    const mine = await loadMine().unwrap();
    const owned = mine.tenants?.find((item) => item.role === 'BUSINESS_OWNER') || mine.tenants?.[0];
    return owned?.tenant?.id ? String(owned.tenant.id) : '';
  }

  async function publish() {
    setFormError('');
    try {
      const id = await resolveId();
      if (!REAL_ID.test(id)) {
        setFormError('Studio još nije u bazi. Otvorite ga registracijom, pa spremite stranicu.');
        return;
      }
      const chosenPalette = findPalette(draft.palette);
      await updateTenant({
        id,
        body: {
          ...present({
            description: draft.description.trim().slice(0, DESCRIPTION_MAX),
            phone: draft.phone.trim(),
            email: draft.email.trim(),
            address: draft.address.trim(),
            city: draft.city.trim(),
          }),
          mapsUrl: String(draft.mapsUrl || '').trim(),
          bookingSettings: { workingHours: hoursPayload(draft.hours) },
        },
      }).unwrap();
      await updateSite({
        id,
        body: {
          template: findTemplate(draft.template).id,
          layout: findLayout(draft.layout).id,
          paletteId: chosenPalette.id,
          theme: themePayload(chosenPalette.theme),
          visibleSections: draft.sections,
          seo: {
            title: studio.name,
            description: draft.description.trim().slice(0, 300),
          },
        },
      }).unwrap();
      let heroImageUrl = draft.heroImageUrl;
      let logoUrl = draft.logoUrl;
      if (heroFile) {
        const uploaded = await uploadImage({ id, file: heroFile, purpose: 'hero' }).unwrap();
        heroImageUrl = uploaded.tenant.heroImageUrl;
      }
      if (logoFile) {
        const uploaded = await uploadImage({ id, file: logoFile, purpose: 'logo' }).unwrap();
        logoUrl = uploaded.tenant.logoUrl;
      }
      saveStudio({
        ...studio,
        ...draft,
        id,
        heroImageUrl,
        logoUrl,
        guideDone: true,
      });
      navigate('/stranica');
    } catch (error) {
      setFormError(saveMessage(error));
    }
  }

  return (
    <main className={step === 0 ? 'setup setup--guide' : step === 5 ? 'setup setup--wide' : 'setup'}>
      <p className="setup__step">
        Korak
        {' '}
        {step + 1}
        {' '}
        od 6
        {step === 2 ? ' · Informacije o poslovanju' : ''}
        {step === 3 ? ' · Sadržaj stranice' : ''}
      </p>

      {step === 0 ? (
        <>
          <p className="setup__host" aria-label="Adresa stranice">{hostname}</p>
          <h1>Dobrodošli, {studio.name}.</h1>
          <p className="setup__lead">
            Ovo je vaša poddomena na Blizariju. Sad birate predložak i raspored
            (header, stupac, traka) — boja, tekst i slike dolaze u sljedećim koracima.
          </p>
          <ol className="guide__path">
            <li className="is-now">Predložak</li>
            <li>Boje</li>
            <li>Informacije</li>
            <li>Sadržaj</li>
            <li>Slike</li>
            <li>Pregled</li>
          </ol>
          <section className="guide__block">
            <h2>Predložak za vašu djelatnost</h2>
            <p>
              Predložak postavlja početni raspored i boje. Kasnije sve možete
              prilagoditi.
            </p>
            <div className="templates" role="radiogroup" aria-label="Predložak stranice">
              {siteTemplates.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.template === item.id}
                  className={draft.template === item.id ? 'template is-selected' : 'template'}
                  onClick={() => pickTemplate(item.id)}
                >
                  <span className="template__name">{item.name}</span>
                  <span className="template__note">{item.note}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="guide__block">
            <h2>Raspored stranice</h2>
            <p>
              Header je na svakom predlošku. Naslovnica ga širi. Traka ga drži uskim.
              Stupac dodaje bočnu traku za kontakt i sate.
            </p>
            <div className="layouts" role="radiogroup" aria-label="Raspored stranice">
              {pageLayouts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={draft.layout === item.id}
                  className={draft.layout === item.id ? 'layout is-selected' : 'layout'}
                  onClick={() => change('layout', item.id)}
                >
                  <LayoutSketch id={item.id} />
                  <span className="layout__name">{item.name}</span>
                  <span className="layout__note">{item.note}</span>
                </button>
              ))}
            </div>
          </section>
          <div className="setup__actions">
            <button className="setup__submit" type="button" onClick={() => keep(1)}>
              Odaberite boje
            </button>
          </div>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <h1>Odaberite boje.</h1>
          <p className="setup__lead">
            Prvih pet je preporučeno za vaš predložak. Ostale su dostupne ispod.
          </p>
          <div className="setup__palette" role="radiogroup" aria-label="Paleta boja">
            {palettes.map((item) => {
              const isRecommended = recommendedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-label={isRecommended ? `${item.name}, preporučeno` : item.name}
                  aria-checked={draft.palette === item.id}
                  className={[
                    'setup__choice',
                    draft.palette === item.id ? 'is-selected' : '',
                    isRecommended ? 'is-recommended' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => change('palette', item.id)}
                >
                  <span
                    className="setup__swatch"
                    style={{
                      background: `linear-gradient(90deg, ${item.theme.primaryColor} 62%, ${item.theme.secondaryColor} 62%)`,
                    }}
                  />
                  {isRecommended ? <span className="setup__choice-badge">Preporučeno</span> : null}
                </button>
              );
            })}
          </div>
          <article className="setup__preview" style={previewStyle}>
            <p className="setup__preview-host">{hostname}</p>
            <h2>{studio.name}</h2>
            <p>{draft.description || 'Ovdje stoji rečenica o studiju.'}</p>
            <span className="setup__preview-book">Odaberite termin</span>
          </article>
          <div className="setup__actions">
            <button className="setup__back" type="button" onClick={() => setStep(0)}>Natrag</button>
            <button className="setup__submit" type="button" onClick={() => keep(2)}>Dalje</button>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <h1>Predstavite svoje poslovanje.</h1>
          <p className="setup__lead">
            Ovdje unosite informacije koje će vaši klijenti vidjeti prije nego što
            rezerviraju termin. Recite im tko ste, čime se bavite i kako vas mogu
            kontaktirati.
          </p>
          <form className="setup__form setup__story" onSubmit={nextFromText} noValidate>
            <section className="setup__card" aria-labelledby="about-title">
              <div className="setup__card-head">
                <span className="setup__card-icon" aria-hidden="true">
                  <SetupSectionIcon type="about" />
                </span>
                <div>
                  <h2 id="about-title">O vašem poslovanju</h2>
                  <p className="setup__card-lead">
                    Ukratko predstavite svoje poslovanje, usluge i ono što vas čini posebnima.
                  </p>
                </div>
              </div>
              <label className="setup__field">
                <span className="visually-hidden">Opis poslovanja</span>
                <textarea
                  id="studio-about"
                  name="description"
                  rows="5"
                  maxLength={DESCRIPTION_MAX}
                  placeholder={DESCRIPTION_EXAMPLE}
                  value={draft.description || ''}
                  onChange={(event) => changeDescription(event.target.value)}
                  aria-invalid={Boolean(problems.description)}
                  aria-describedby="about-hint about-count"
                />
              </label>
              <div className="setup__meta-row">
                <p id="about-hint" className="setup__example">
                  Primjer:
                  {' '}
                  {DESCRIPTION_EXAMPLE}
                </p>
                <p
                  id="about-count"
                  className={(draft.description || '').length >= DESCRIPTION_MAX ? 'setup__count is-max' : 'setup__count'}
                >
                  {(draft.description || '').length}
                  /
                  {DESCRIPTION_MAX}
                </p>
              </div>
              {problems.description ? <span className="setup__error">{problems.description}</span> : null}
            </section>

            <section className="setup__card" aria-labelledby="contact-title">
              <div className="setup__card-head">
                <span className="setup__card-icon" aria-hidden="true">
                  <SetupSectionIcon type="contact" />
                </span>
                <div>
                  <h2 id="contact-title">Kontakt i lokacija</h2>
                  <p className="setup__card-lead">
                    Unesite podatke putem kojih vas klijenti mogu kontaktirati i pronaći.
                  </p>
                </div>
              </div>
              <div className="setup__pair">
                <label>
                  Telefon
                  <input
                    name="tel"
                    autoComplete="tel"
                    value={draft.phone}
                    onChange={(event) => change('phone', event.target.value)}
                  />
                </label>
                <label>
                  E-pošta
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={draft.email}
                    onChange={(event) => change('email', event.target.value)}
                    aria-invalid={Boolean(problems.email)}
                  />
                  {problems.email ? <span className="setup__error">{problems.email}</span> : null}
                </label>
              </div>
              <label>
                Ulica i kućni broj
                <input
                  name="street-address"
                  autoComplete="street-address"
                  value={draft.address}
                  onChange={(event) => change('address', event.target.value)}
                  placeholder="Ulica i kućni broj"
                />
              </label>
              <label>
                Grad
                <input
                  name="address-level2"
                  autoComplete="address-level2"
                  value={draft.city}
                  onChange={(event) => change('city', event.target.value)}
                  placeholder="npr. Zagreb"
                />
              </label>
              <label>
                <span>
                  Google Maps poveznica
                  <span className="setup__optional">opcionalno</span>
                </span>
                <input
                  name="maps-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://maps.google.com/…"
                  value={draft.mapsUrl || ''}
                  onChange={(event) => change('mapsUrl', event.target.value)}
                  aria-invalid={Boolean(problems.mapsUrl)}
                />
              </label>
              {problems.mapsUrl ? <span className="setup__error">{problems.mapsUrl}</span> : null}
            </section>

            <section className="setup__card" aria-labelledby="hours-title">
              <div className="setup__card-head">
                <span className="setup__card-icon" aria-hidden="true">
                  <SetupSectionIcon type="hours" />
                </span>
                <div>
                  <h2 id="hours-title">Radno vrijeme</h2>
                  <p className="setup__card-lead">
                    Odredite kada ste dostupni svojim klijentima. Prikazano radno vrijeme
                    pomoći će im da lakše isplaniraju svoj dolazak.
                  </p>
                </div>
              </div>
              <p className="setup__note">
                Ovo je redovno radno vrijeme poslovanja, ne raspored rezervacija.
                Termine, usluge i stvarnu dostupnost postavljate u sljedećim koracima.
              </p>
              <div className="setup__hours-tools">
                <button
                  className="setup__ghost"
                  type="button"
                  onClick={copyHoursAcrossWeekdays}
                >
                  Kopiraj radno vrijeme
                </button>
                <span className="setup__hours-tools-hint">
                  Prenosi sate s prvog otvorenog radnog dana na ostale otvorene dane u tjednu.
                </span>
              </div>
              <div className="setup__days">
                {hourRows.map((entry) => {
                  const key = Array.isArray(entry) ? entry[0] : entry.key;
                  const label = Array.isArray(entry) ? entry[1] : entry.label;
                  const row = draft.hours?.[key] || fallbackHours[key];
                  const isHoliday = key === 'holidays';
                  return (
                    <div
                      className={[
                        'setup__day',
                        row?.works ? '' : 'is-closed',
                        isHoliday ? 'setup__day--holiday' : '',
                      ].filter(Boolean).join(' ')}
                      key={key}
                    >
                      <label className="setup__check">
                        <span className="setup__switch">
                          <input
                            type="checkbox"
                            role="switch"
                            checked={Boolean(row?.works)}
                            aria-checked={Boolean(row?.works)}
                            onChange={(event) => changeHours(key, { works: event.target.checked })}
                          />
                          <span aria-hidden="true" />
                        </span>
                        {label}
                      </label>
                      {row?.works ? (
                        <div className="setup__span">
                          <TimeSelect
                            label={`${label}, od`}
                            value={row.from}
                            open={openClock === `${key}-from`}
                            onOpen={() => setOpenClock(`${key}-from`)}
                            onClose={() => setOpenClock('')}
                            onChange={(from) => changeHours(key, { from })}
                          />
                          <span className="setup__dash" aria-hidden="true">–</span>
                          <TimeSelect
                            label={`${label}, do`}
                            value={row.to}
                            open={openClock === `${key}-to`}
                            onOpen={() => setOpenClock(`${key}-to`)}
                            onClose={() => setOpenClock('')}
                            onChange={(to) => changeHours(key, { to })}
                          />
                        </div>
                      ) : (
                        <span className="setup__closed">Zatvoreno</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="setup__note setup__note--soft">
                Blagdani mogu imati posebno radno vrijeme. Godišnje odmore i jednokratne
                iznimke kasnije blokirate u kalendaru — redovno radno vrijeme nije jedino
                mjerilo dostupnosti termina.
              </p>
              {problems.hours ? <span className="setup__error">{problems.hours}</span> : null}
            </section>

            <div className="setup__actions">
              <button className="setup__back" type="button" onClick={() => setStep(1)}>Natrag</button>
              <button className="setup__submit" type="submit">Dalje</button>
            </div>
          </form>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <h1>Odaberite što će klijenti vidjeti.</h1>
          <p className="setup__lead">
            Odaberite koje informacije želite prikazati na svojoj stranici. Uključite
            samo one koje su važne za vaše poslovanje. Postavke možete promijeniti i
            kasnije.
          </p>

          <section className="setup__card setup__sections-card" aria-labelledby="required-content-title">
            <h2 id="required-content-title">Obavezni sadržaj</h2>
            <div className="setup__section-item is-locked">
              <span className="setup__section-icon" aria-hidden="true">
                <SetupSectionIcon type="schedule" />
              </span>
              <div className="setup__section-copy">
                <strong>Rezervacije i termini</strong>
                <p>Klijenti uvijek mogu pregledati dostupne termine i rezervirati uslugu.</p>
              </div>
              <span className="setup__section-badge">Uvijek uključeno</span>
            </div>
          </section>

          <section className="setup__card setup__sections-card" aria-labelledby="optional-content-title">
            <h2 id="optional-content-title">Dodatne informacije</h2>
            <p className="setup__card-lead">
              Uključite dijelove stranice koje želite prikazati klijentima. Isključivanje
              samo sakriva dio — uneseni podaci ostaju spremljeni.
            </p>
            <ul className="setup__sections">
              {sectionFields.map((item) => {
                const key = item.key;
                const on = Boolean(draft.sections?.[key]);
                return (
                  <li key={key}>
                    <label className={on ? 'setup__section-item is-on' : 'setup__section-item'}>
                      <span className="setup__section-icon" aria-hidden="true">
                        <SetupSectionIcon type={item.icon} />
                      </span>
                      <span className="setup__section-copy">
                        <strong>{item.label}</strong>
                        <em>{item.note}</em>
                      </span>
                      <span className="setup__switch">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={on}
                          aria-checked={on}
                          onChange={(event) => changeSection(key, event.target.checked)}
                        />
                        <span aria-hidden="true" />
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="setup__actions">
            <button className="setup__back" type="button" onClick={() => setStep(2)}>Natrag</button>
            <button className="setup__submit" type="button" onClick={() => keep(4)}>Dalje</button>
          </div>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <h1>Slike.</h1>
          <p className="setup__lead">Pozadina ide na vrh stranice. Znak je manji, uz naziv.</p>
          <div className="setup__story">
            <section className="setup__card">
              <h2>Pozadina</h2>
              <div
                className="setup__shot"
                style={(heroPreview || draft.heroImageUrl)
                  ? { backgroundImage: `url("${heroPreview || mediaUrl(draft.heroImageUrl)}")` }
                  : undefined}
              />
              <label className="setup__file">
                Odaberite pozadinu
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => readImage(event.target.files?.[0], setHeroFile, setHeroPreview)}
                />
              </label>
            </section>
            <section className="setup__card">
              <h2>Znak</h2>
              <div
                className="setup__mark"
                style={(logoPreview || draft.logoUrl)
                  ? { backgroundImage: `url("${logoPreview || mediaUrl(draft.logoUrl)}")` }
                  : undefined}
              />
              <label className="setup__file">
                Odaberite znak
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => readImage(event.target.files?.[0], setLogoFile, setLogoPreview)}
                />
              </label>
            </section>
          </div>
          <div className="setup__actions">
            <button className="setup__back" type="button" onClick={() => setStep(3)}>Natrag</button>
            <button className="setup__submit" type="button" onClick={() => keep(5)}>Pogledajte</button>
          </div>
        </>
      ) : null}

      {step === 5 ? (
        <>
          <h1>Ovako izgleda.</h1>
          <p className="setup__lead">Isti prikaz koji klijent dobije u pregledniku.</p>
          <div className="browser">
            <div className="browser__chrome">
              <span className="browser__dots" aria-hidden="true"><span /><span /><span /></span>
              <span className="browser__url">{hostname}</span>
            </div>
            <SiteFrame
              name={studio.name}
              description={draft.description}
              phone={draft.phone}
              email={draft.email}
              address={draft.address}
              mapsUrl={draft.mapsUrl || ''}
              heroSrc={frameSources(draft, heroPreview, logoPreview).heroSrc}
              logoSrc={frameSources(draft, heroPreview, logoPreview).logoSrc}
              palette={chosen}
              sections={draft.sections}
              galleryImages={studio.siteSettings?.gallery || []}
              hours={draft.hours}
              layout={draft.layout}
              slug={studio.slug}
              legalBase={studio.slug ? `/s/${studio.slug}` : ''}
            />
          </div>
          {formError ? <p className="setup__form-error">{formError}</p> : null}
          <div className="setup__actions">
            <button className="setup__back" type="button" onClick={() => setStep(4)} disabled={saving}>
              Natrag
            </button>
            <button className="setup__submit" type="button" onClick={publish} disabled={saving}>
              {saving ? 'Spremamo…' : 'Spremite stranicu'}
            </button>
          </div>
        </>
      ) : null}
    </main>
  );
}
