import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  useLazyMyTenantsQuery,
  useUpdateSiteMutation,
  useUpdateTenantMutation,
  useUploadImageMutation,
} from '../../api/tenantApi.js';
import { loadStudio, mediaUrl, saveStudio } from '../../studio.js';
import { findLayout, pageLayouts } from './layouts.js';
import { findPalette, studioPalettes, themePayload } from '../../styles/studioPalette.js';
import SiteFrame, { frameSources } from './SiteFrame.jsx';
import {
  findTemplate,
  siteTemplates,
  studioHost,
  templateForNiche,
} from './siteTemplates.js';
import TimeSelect from './TimeSelect.jsx';
import { fallbackHours, hourRows, studioHours } from './studioTime.js';
import './SetupPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;

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
  ['hero', 'Naslovnica'],
  ['about', 'O studiju'],
  ['contact', 'Kontakt'],
  ['location', 'Lokacija'],
  ['openingHours', 'Radno vrijeme'],
];

function draftFrom(studio) {
  const suggested = templateForNiche(studio.niche);
  const template = findTemplate(studio.template || suggested.id);
  return {
    description: studio.description || '',
    phone: studio.phone || '',
    email: studio.email || '',
    address: studio.address || '',
    hours: studioHours(studio),
    sections: { ...defaultSections, ...studio.sections, services: true, schedule: true },
    template: template.id,
    palette: findPalette(studio.palette || template.palette).id,
    layout: findLayout(studio.layout || template.layout).id,
    heroImageUrl: studio.heroImageUrl || '',
    logoUrl: studio.logoUrl || '',
  };
}

function problemsFor(draft) {
  const problems = {};
  if (!draft.description.trim()) problems.description = 'Napišite što studio radi.';
  if (draft.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
    problems.email = 'Upišite ispravnu e-poštu.';
  }
  const hoursWrong = hourRows.some(([key]) => {
    const row = draft.hours[key] || fallbackHours[key];
    return row.works && row.from >= row.to;
  });
  if (hoursWrong) problems.hours = 'Zatvaranje treba biti nakon otvaranja.';
  return problems;
}

function hoursPayload(hours) {
  const row = (day, value) => (
    value.works
      ? { day, closed: false, open: value.from, close: value.to }
      : { day, closed: true }
  );
  return [
    row(1, hours.week),
    row(2, hours.week),
    row(3, hours.week),
    row(4, hours.week),
    row(5, hours.week),
    row(6, hours.saturday),
    row(0, hours.sunday),
  ];
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
    setDraft((current) => ({
      ...current,
      template: item.id,
      layout: item.layout,
      palette: item.palette,
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

  function changeSection(key, value) {
    setDraft((current) => ({
      ...current,
      sections: { ...current.sections, [key]: value },
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
            description: draft.description.trim(),
            phone: draft.phone.trim(),
            email: draft.email.trim(),
            address: draft.address.trim(),
          }),
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
      <p className="setup__step">Korak {step + 1} od 6</p>

      {step === 0 ? (
        <>
          <p className="setup__host" aria-label="Adresa stranice">{hostname}</p>
          <h1>Dobrodošli, {studio.name}.</h1>
          <p className="setup__lead">
            Ovo je vaša poddomena na anyminutesu. Sad birate predložak i raspored
            (header, stupac, traka) — boja, tekst i slike dolaze u sljedećim koracima.
          </p>
          <ol className="guide__path">
            <li className="is-now">Predložak</li>
            <li>Boje</li>
            <li>Tekst</li>
            <li>Dijelovi</li>
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
            Dvije boje za {hostname}. Klijenti ih vide čim otvore stranicu.
          </p>
          <div className="setup__palette" role="radiogroup" aria-label="Paleta boja">
            {studioPalettes.map((item) => (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-label={item.name}
                aria-checked={draft.palette === item.id}
                className={draft.palette === item.id ? 'setup__choice is-selected' : 'setup__choice'}
                onClick={() => change('palette', item.id)}
              >
                <span
                  className="setup__swatch"
                  style={{
                    background: `linear-gradient(90deg, ${item.theme.primaryColor} 62%, ${item.theme.secondaryColor} 62%)`,
                  }}
                />
              </button>
            ))}
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
          <h1>Što piše.</h1>
          <p className="setup__lead">
            Ovo klijent pročita prije nego odabere termin.
          </p>
          <form className="setup__form setup__story" onSubmit={nextFromText} noValidate>
            <section className="setup__card">
              <h2 id="about-title">O studiju</h2>
              <textarea
                id="studio-about"
                name="description"
                rows="4"
                aria-labelledby="about-title"
                placeholder="Grupni treninzi, ograničen broj mjesta."
                value={draft.description}
                onChange={(event) => change('description', event.target.value)}
                aria-invalid={Boolean(problems.description)}
              />
              {problems.description ? <span className="setup__error">{problems.description}</span> : null}
            </section>
            <section className="setup__card">
              <h2>Kako vas se dobije</h2>
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
                Ulica i grad
                <input
                  name="street-address"
                  autoComplete="street-address"
                  value={draft.address}
                  onChange={(event) => change('address', event.target.value)}
                />
              </label>
            </section>
            <section className="setup__card" aria-labelledby="hours-title">
              <h2 id="hours-title">Kad radite</h2>
              <div className="setup__days">
              {hourRows.map(([key, label]) => {
                const row = draft.hours[key] || fallbackHours[key];
                return (
                  <div className={row.works ? 'setup__day' : 'setup__day is-closed'} key={key}>
                    <label className="setup__check">
                      <input
                        type="checkbox"
                        checked={row.works}
                        onChange={(event) => changeHours(key, { works: event.target.checked })}
                      />
                      {label}
                    </label>
                    {row.works ? (
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
          <h1>Što ostaje na stranici.</h1>
          <p className="setup__lead">Termini ostaju. Ostale dijelove uključite ako ih klijent treba.</p>
          <ul className="setup__sections">
            <li>Termini su na stranici.</li>
            {sectionFields.map(([key, label]) => (
              <li key={key}>
                <label className="setup__check">
                  <input
                    type="checkbox"
                    checked={draft.sections[key]}
                    onChange={(event) => changeSection(key, event.target.checked)}
                  />
                  {label}
                </label>
              </li>
            ))}
          </ul>
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
              heroSrc={frameSources(draft, heroPreview, logoPreview).heroSrc}
              logoSrc={frameSources(draft, heroPreview, logoPreview).logoSrc}
              palette={chosen}
              sections={draft.sections}
              hours={draft.hours}
              layout={draft.layout}
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
