import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  useChangePasswordMutation,
  useGetMeQuery,
  useUpdateMeMutation,
} from '../../api/authApi.js';
import {
  useCreateServiceMutation,
  useListServicesQuery,
  useUpdateServiceMutation,
} from '../../api/serviceApi.js';
import { useUpdateSiteMutation, useUpdateTenantMutation } from '../../api/tenantApi.js';
import { saveStudio, STUDIO_KEY } from '../../lib/studio.js';
import { studioHost } from './siteTemplates.js';
import { generateAllStudioLegal } from './studioLegal.js';
import PrivacyConsentPanel from '../../components/PrivacyConsentPanel.jsx';
import { disableWebPush, enableWebPush, getPushStatus, pushSupported } from '../../lib/push.js';
import CancelWindowSelect from './CancelWindowSelect.jsx';
import TimeSelect from './TimeSelect.jsx';
import {
  fallbackHours,
  formatCancellationWindow,
  hourRows,
  hoursPayload,
  studioHours,
} from './studioTime.js';
import './SetupPage.scss';
import './SettingsPage.scss';

const REAL_ID = /^[a-f\d]{24}$/i;
const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';
const PREFS_KEY = 'bookingspace.prefs';

const sections = [
  { id: 'business', label: 'Poslovanje' },
  { id: 'account', label: 'Račun' },
  { id: 'security', label: 'Sigurnost' },
  { id: 'privacy', label: 'Privatnost' },
  { id: 'billing', label: 'Pretplata' },
  { id: 'notifications', label: 'Obavijesti' },
];

const LEGAL_DOCS = [
  { id: 'privacy', index: '01', label: 'Privatnost', title: 'Politika privatnosti' },
  { id: 'terms', index: '02', label: 'Uvjeti', title: 'Uvjeti korištenja' },
  { id: 'cookies', index: '03', label: 'Kolačići', title: 'Kolačići i sigurnost' },
];

function studioLegalSource(studio, form = {}) {
  return {
    name: form.name || studio.name || 'Studio',
    email: form.email || studio.email || '',
    phone: form.phone || studio.phone || '',
    address: form.address || studio.address || '',
  };
}

function resolveLegalState(studio, form = {}) {
  const stored = studio.siteSettings?.legal || {};
  const generated = generateAllStudioLegal(studioLegalSource(studio, form));
  return {
    privacy: (stored.privacy || '').trim() || generated.privacy,
    terms: (stored.terms || '').trim() || generated.terms,
    cookies: (stored.cookies || '').trim() || generated.cookies,
  };
}

const defaultPrefs = {
  bookingEmail: true,
  cancelEmail: true,
  memberEmail: true,
  weeklyDigest: false,
  marketing: false,
  bookingPush: true,
  cancelPush: true,
  memberPush: true,
  reminderPush: false,
};

function filled(body) {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== ''));
}

function fromStudio(studio) {
  return {
    name: studio.name || '',
    description: studio.description || '',
    phone: studio.phone || '',
    email: studio.email || '',
    address: studio.address || '',
    city: studio.city || '',
    oib: studio.oib || '',
    hours: studioHours(studio),
  };
}

function loadPrefs() {
  try {
    return { ...defaultPrefs, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') };
  } catch {
    return { ...defaultPrefs };
  }
}

function saveSessionUser(user) {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const current = raw ? JSON.parse(raw) : {};
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      ...current,
      name: user.name,
      email: user.email,
      role: user.role || current.role,
    }));
  } catch {
    /* ignore */
  }
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
  value,
  onChange,
  autoComplete = 'new-password',
  className,
}) {
  const [visible, setVisible] = useState(false);
  const tip = visible ? 'Sakrij lozinku' : 'Prikaži lozinku';

  return (
    <label className={['settings__password', className].filter(Boolean).join(' ')}>
      {label}
      <span className="settings__password-wrap">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="settings__eye"
          onClick={() => setVisible((current) => !current)}
          title={tip}
          aria-label={tip}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { studio } = useOutletContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState('business');
  const [form, setForm] = useState(() => fromStudio(studio));
  const [account, setAccount] = useState({ name: '', email: '', phone: '' });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    again: '',
  });
  const [prefs, setPrefs] = useState(loadPrefs);
  const [pushState, setPushState] = useState({
    supported: pushSupported(),
    permission: 'default',
    subscribed: false,
  });
  const [pushBusy, setPushBusy] = useState(false);
  const [openClock, setOpenClock] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const pushClient = import.meta.env.VITE_APP_SHELL === 'mobile' ? 'mobile' : 'web';
  const [updateTenant, { isLoading: savingBusiness }] = useUpdateTenantMutation();
  const [updateSite, { isLoading: savingLegal }] = useUpdateSiteMutation();
  const [updateMe, { isLoading: savingAccount }] = useUpdateMeMutation();
  const [changePassword, { isLoading: savingPassword }] = useChangePasswordMutation();
  const [legal, setLegal] = useState(() => resolveLegalState(studio));
  const [legalTab, setLegalTab] = useState('privacy');
  const [legalConfirmOpen, setLegalConfirmOpen] = useState(false);
  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const { data: meData } = useGetMeQuery();
  const ready = REAL_ID.test(String(studio.id || ''));
  const { data: serviceData } = useListServicesQuery(String(studio.id || ''), {
    skip: !ready,
  });
  const [cancelWindow, setCancelWindow] = useState(60);
  const host = studioHost(studio.slug);
  const user = meData?.user;
  const activeSection = sections.find((item) => item.id === tab) || sections[0];
  const activeLegalDoc = LEGAL_DOCS.find((item) => item.id === legalTab) || LEGAL_DOCS[0];
  const primaryService = (serviceData?.services || []).find((item) => item.active !== false)
    || serviceData?.services?.[0]
    || null;
  const legalUpdatedAt = studio.siteSettings?.legal?.updatedAt
    ? new Date(studio.siteSettings.legal.updatedAt).toLocaleString('hr-HR')
    : '';

  useEffect(() => {
    setForm(fromStudio(studio));
    setLegal(resolveLegalState(studio));
  }, [studio]);

  useEffect(() => {
    if (!legalConfirmOpen) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') setLegalConfirmOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [legalConfirmOpen]);

  function requestSaveLegal(event) {
    event.preventDefault();
    if (!ready) {
      note('err', 'Studio još nije spreman na poslužitelju.');
      return;
    }
    const nextLegal = {
      privacy: legal.privacy.trim(),
      terms: legal.terms.trim(),
      cookies: legal.cookies.trim(),
    };
    if (!nextLegal.privacy || !nextLegal.terms || !nextLegal.cookies) {
      note('err', 'Sva tri dokumenta moraju imati tekst prije spremanja.');
      return;
    }
    setLegalConfirmOpen(true);
  }

  async function confirmSaveLegal() {
    const nextLegal = {
      privacy: legal.privacy.trim(),
      terms: legal.terms.trim(),
      cookies: legal.cookies.trim(),
    };
    try {
      const result = await updateSite({
        id: studio.id,
        body: { legal: nextLegal },
      }).unwrap();
      saveStudio({
        ...studio,
        siteSettings: result.tenant?.siteSettings || {
          ...studio.siteSettings,
          legal: {
            ...nextLegal,
            updatedAt: new Date().toISOString(),
          },
        },
      });
      setLegalConfirmOpen(false);
      note('ok', 'Pravila studija su spremljena u bazu i na stranicu.');
    } catch {
      setLegalConfirmOpen(false);
      note('err', 'Pravila nisu spremljena. Pokušajte ponovno.');
    }
  }

  function fillLegalTemplate() {
    const generated = generateAllStudioLegal(studioLegalSource(studio, form));
    setLegal(generated);
    note('ok', 'Gotovi predložak je upisan — pregledajte i spremite ako vam odgovara.');
  }

  useEffect(() => {
    if (!user) return;
    setAccount({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    if (user.notificationPrefs) {
      setPrefs({ ...defaultPrefs, ...user.notificationPrefs });
    }
  }, [user]);

  useEffect(() => {
    if (primaryService?.cancellationWindowMinutes == null) return;
    setCancelWindow(Number(primaryService.cancellationWindowMinutes) || 60);
  }, [primaryService]);

  useEffect(() => {
    let alive = true;
    getPushStatus().then((status) => {
      if (alive) setPushState(status);
    }).catch(() => { });
    return () => { alive = false; };
  }, [tab]);

  const flash = useMemo(() => message, [message]);

  function note(type, text) {
    setMessage({ type, text });
  }

  function selectTab(id) {
    setTab(id);
    setMessage({ type: '', text: '' });
    setOpenClock('');
  }

  function changeBusiness(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage({ type: '', text: '' });
  }

  function changeHours(key, patch) {
    setForm((current) => ({
      ...current,
      hours: {
        ...current.hours,
        [key]: { ...(current.hours[key] || fallbackHours[key]), ...patch },
      },
    }));
    setMessage({ type: '', text: '' });
  }

  async function saveBusiness(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      note('error', 'Upišite naziv poslovanja.');
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      note('error', 'Upišite ispravnu e-poštu poslovanja.');
      return;
    }
    const hoursWrong = hourRows.some(([key]) => {
      const row = form.hours[key] || fallbackHours[key];
      return row.works && row.from >= row.to;
    });
    if (hoursWrong) {
      note('error', 'Zatvaranje treba biti nakon otvaranja.');
      return;
    }
    if (!ready) {
      note('error', 'Studio još nije u bazi. Otvorite ga registracijom.');
      return;
    }

    try {
      await updateTenant({
        id: studio.id,
        body: {
          name: form.name.trim(),
          ...filled({
            description: form.description.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
          }),
          bookingSettings: {
            workingHours: hoursPayload(form.hours),
          },
        },
      }).unwrap();

      const windowMinutes = Number(cancelWindow) || 60;
      if (primaryService?.id) {
        await updateService({
          serviceId: primaryService.id,
          body: { cancellationWindowMinutes: windowMinutes },
        }).unwrap();
      } else {
        await createService({
          tenantId: studio.id,
          body: {
            name: 'Termin',
            durationMinutes: 60,
            slotIntervalMinutes: 60,
            capacity: 12,
            cancellationWindowMinutes: windowMinutes,
            price: 0,
            membershipRequired: true,
          },
        }).unwrap();
      }

      saveStudio({
        ...studio,
        name: form.name.trim(),
        description: form.description.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        hours: form.hours,
      });
      window.dispatchEvent(new Event('studio-changed'));
      note('ok', 'Podaci poslovanja i rok otkaza su spremljeni.');
    } catch (failure) {
      note('error', failure?.status === 'FETCH_ERROR'
        ? 'Poslužitelj nije dostupan.'
        : 'Poslovanje nije spremljeno.');
    }
  }

  async function saveAccount(event) {
    event.preventDefault();
    if (!account.name.trim()) {
      note('error', 'Upišite ime.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) {
      note('error', 'Upišite ispravnu e-poštu računa.');
      return;
    }
    const oib = form.oib.trim();
    if (oib && !/^\d{11}$/.test(oib)) {
      note('error', 'OIB mora imati točno 11 znamenki.');
      return;
    }
    try {
      const result = await updateMe({
        name: account.name.trim(),
        email: account.email.trim().toLowerCase(),
        phone: account.phone.trim() || undefined,
      }).unwrap();
      saveSessionUser(result.user);

      if (ready) {
        await updateTenant({
          id: studio.id,
          body: {
            address: form.address.trim(),
            city: form.city.trim(),
            oib,
          },
        }).unwrap();
        saveStudio({
          ...studio,
          address: form.address.trim(),
          city: form.city.trim(),
          oib,
        });
        window.dispatchEvent(new Event('studio-changed'));
      }

      note('ok', 'Račun je ažuriran.');
    } catch (failure) {
      if (failure?.data?.code === 'EMAIL_TAKEN') {
        note('error', 'Ta e-pošta je već zauzeta.');
        return;
      }
      note('error', failure?.status === 'FETCH_ERROR'
        ? 'Poslužitelj nije dostupan.'
        : 'Račun nije spremljen.');
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (password.newPassword.length < 8) {
      note('error', 'Nova lozinka treba barem 8 znakova.');
      return;
    }
    if (password.newPassword !== password.again) {
      note('error', 'Nove lozinke se ne podudaraju.');
      return;
    }
    try {
      await changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      }).unwrap();
      setPassword({ currentPassword: '', newPassword: '', again: '' });
      note('ok', 'Lozinka je promijenjena.');
    } catch (failure) {
      if (failure?.data?.code === 'INVALID_CREDENTIALS') {
        note('error', 'Trenutna lozinka nije točna.');
        return;
      }
      note('error', failure?.status === 'FETCH_ERROR'
        ? 'Poslužitelj nije dostupan.'
        : 'Lozinka nije promijenjena.');
    }
  }

  async function savePrefs(event) {
    event.preventDefault();
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    if (!ready) {
      note('ok', 'Postavke su spremljene na ovom uređaju.');
      return;
    }
    try {
      await updateMe({ notificationPrefs: prefs }).unwrap();
      note('ok', pushState.subscribed
        ? 'Obavijesti su spremljene. E-pošta i push na ovom uređaju su aktivni.'
        : 'Obavijesti su spremljene. Za push na ovom uređaju uključite dozvolu ispod.');
    } catch (failure) {
      note('error', failure?.status === 'FETCH_ERROR'
        ? 'Poslužitelj nije dostupan.'
        : 'Obavijesti nisu spremljene.');
    }
  }

  async function toggleDevicePush() {
    setPushBusy(true);
    try {
      if (pushState.subscribed) {
        await disableWebPush();
        setPushState(await getPushStatus());
        note('ok', 'Push na ovom uređaju je isključen.');
      } else {
        const result = await enableWebPush({ client: pushClient });
        setPushState(await getPushStatus());
        if (result.ok) note('ok', 'Push je uključen na ovom uređaju.');
        else if (result.reason === 'denied') note('error', 'Dozvola za obavijesti je odbijena u pregledniku.');
        else if (result.reason === 'not_configured') note('error', 'Push nije konfiguriran na poslužitelju (VAPID).');
        else note('error', 'Ovaj preglednik ne podržava Web Push.');
      }
    } catch (error) {
      note('error', error?.message || 'Push nije moguće promijeniti.');
    } finally {
      setPushBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STUDIO_KEY);
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('studio-changed'));
    navigate('/', { replace: true });
  }

  const emailPrefsOn = ['bookingEmail', 'cancelEmail', 'memberEmail', 'weeklyDigest', 'marketing']
    .filter((key) => prefs[key]).length;
  const pushPrefsOn = ['bookingPush', 'cancelPush', 'memberPush', 'reminderPush']
    .filter((key) => prefs[key]).length;

  return (
    <section className={`settings${tab === 'notifications' ? ' settings--notify' : ''}`}>
      <div className="settings__atmosphere" aria-hidden="true">
        <span className="settings__wash" />
        <span className="settings__grain" />
      </div>
      <div className="settings__rail">
        <div className="settings__rail-inner">
          <p className="settings__rail-label">Postavke</p>
          <nav className="settings__tabs" aria-label="Grupe postavki">
            {sections.map((item) => (
              <button
                key={item.id}
                type="button"
                className={tab === item.id ? 'is-on' : undefined}
                aria-current={tab === item.id ? 'page' : undefined}
                onClick={() => selectTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="settings__stage">
        <header className="settings__intro">
          <div>
            <p className="settings__eyebrow">{activeSection.label}</p>
            <h1>{studio.name || 'Postavke'}</h1>
            <p>
              {tab === 'business' && 'Naziv, kontakt, radno vrijeme i rok otkaza koji vide članovi.'}
              {tab === 'account' && 'Podaci za prijavu, adresa studija i OIB za buduću naplatu.'}
              {tab === 'security' && 'Lozinka i sesija na ovom uređaju.'}
              {tab === 'privacy' && 'Kako se koriste podaci studija i gdje su pravila.'}
              {tab === 'billing' && 'Plan usluge i naplata — trenutačno u pilotu.'}
              {tab === 'notifications' && 'E-pošta i push na mobitel o rezervacijama i članovima.'}
            </p>
          </div>
          {host ? (
            <p className="settings__host">
              <span>Javna adresa</span>
              <strong>{host}</strong>
            </p>
          ) : null}
        </header>

        {flash.text ? (
          <p className={flash.type === 'ok' ? 'settings__ok' : 'settings__error'}>{flash.text}</p>
        ) : null}

        {tab === 'business' ? (
          <form className="settings__sheet" onSubmit={saveBusiness}>
            <div className="settings__grid">
              <label className="settings__full">
                Naziv
                <input value={form.name} onChange={(event) => changeBusiness('name', event.target.value)} />
              </label>
              <label className="settings__full">
                Kratki opis
                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(event) => changeBusiness('description', event.target.value)}
                />
              </label>
              <label>
                Telefon
                <input value={form.phone} onChange={(event) => changeBusiness('phone', event.target.value)} />
              </label>
              <label>
                E-pošta poslovanja
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => changeBusiness('email', event.target.value)}
                />
              </label>
              <label className="settings__full">
                Ulica
                <input
                  value={form.address}
                  onChange={(event) => changeBusiness('address', event.target.value)}
                  placeholder="Ulica i kućni broj"
                  autoComplete="street-address"
                />
              </label>
              <label>
                Grad
                <input
                  value={form.city}
                  onChange={(event) => changeBusiness('city', event.target.value)}
                  placeholder="npr. Zagreb"
                  autoComplete="address-level2"
                />
              </label>
            </div>

            <div className="settings__hours-block">
              <h2>Radno vrijeme</h2>
              <div className="settings__hours">
                {hourRows.map(([key, label]) => {
                  const row = form.hours[key] || fallbackHours[key];
                  return (
                    <div className="settings__hours-row" key={key}>
                      <label className="settings__check">
                        <input
                          type="checkbox"
                          checked={row.works}
                          onChange={(event) => changeHours(key, { works: event.target.checked })}
                        />
                        {label}
                      </label>
                      {row.works ? (
                        <div className="settings__hours-span">
                          <TimeSelect
                            label={`${label}, od`}
                            value={row.from}
                            open={openClock === `${key}-from`}
                            onOpen={() => setOpenClock(`${key}-from`)}
                            onClose={() => setOpenClock('')}
                            onChange={(from) => changeHours(key, { from })}
                          />
                          <span aria-hidden="true">–</span>
                          <TimeSelect
                            label={`${label}, do`}
                            value={row.to}
                            open={openClock === `${key}-to`}
                            onOpen={() => setOpenClock(`${key}-to`)}
                            onClose={() => setOpenClock('')}
                            onChange={(to) => changeHours(key, { to })}
                          />
                        </div>
                      ) : <span className="settings__closed">Zatvoreno</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="settings__hours-block settings__hours-block--cancel">
              <h2>Otkazivanje termina</h2>
              <p className="settings__hint">
                Članovi ovo vide na stranici Termini. Ako otkažu unutar roka,
                termin im se ne broji kao iskorišten.
              </p>
              <CancelWindowSelect
                value={cancelWindow}
                open={openClock === 'cancel-window'}
                onOpen={() => setOpenClock('cancel-window')}
                onClose={() => setOpenClock('')}
                onChange={(next) => {
                  setCancelWindow(Number(next));
                  setMessage({ type: '', text: '' });
                }}
              />
              <p className="settings__hint">
                Trenutačno:
                {' '}
                <strong>{formatCancellationWindow(cancelWindow)}</strong>
                {' '}
                · sprema se tipkom „Spremite poslovanje”
              </p>
            </div>

            <div className="settings__actions">
              <button className="settings__primary" type="submit" disabled={savingBusiness}>
                {savingBusiness ? 'Spremamo…' : 'Spremite poslovanje'}
              </button>
            </div>
          </form>
        ) : null}

        {tab === 'account' ? (
          <form className="settings__sheet" onSubmit={saveAccount}>
            <div className="settings__grid">
              <label>
                Ime i prezime
                <input
                  value={account.name}
                  onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Telefon
                <input
                  value={account.phone}
                  onChange={(event) => setAccount((current) => ({ ...current, phone: event.target.value }))}
                />
              </label>
              <label className="settings__full">
                E-pošta za prijavu
                <input
                  type="email"
                  value={account.email}
                  onChange={(event) => setAccount((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label className="settings__full">
                Ulica
                <input
                  value={form.address}
                  onChange={(event) => changeBusiness('address', event.target.value)}
                  placeholder="Ulica i kućni broj"
                  autoComplete="street-address"
                />
              </label>
              <label>
                Grad
                <input
                  value={form.city}
                  onChange={(event) => changeBusiness('city', event.target.value)}
                  placeholder="npr. Zagreb"
                  autoComplete="address-level2"
                />
              </label>
              <label className="settings__full">
                OIB
                <input
                  value={form.oib}
                  onChange={(event) => changeBusiness('oib', event.target.value.replace(/\D/g, '').slice(0, 11))}
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="11 znamenki (opcionalno)"
                  autoComplete="off"
                />
              </label>
            </div>
            <p className="settings__fine">
              OIB nije obavezan sada — trebat će ga kad uključimo plaćanje karticom i izdavanje računa.
            </p>
            <div className="settings__actions">
              <button
                className="settings__primary"
                type="submit"
                disabled={savingAccount || savingBusiness}
              >
                {savingAccount || savingBusiness ? 'Spremamo…' : 'Spremite račun'}
              </button>
            </div>
          </form>
        ) : null}

        {tab === 'security' ? (
          <div className="settings__stack">
            <form className="settings__sheet" onSubmit={savePassword}>
              <h2>Lozinka</h2>
              <p className="settings__lead">Koristite jaku lozinku koju ne dijelite s osobljem.</p>
              <div className="settings__grid">
                <PasswordField
                  className="settings__full"
                  label="Trenutna lozinka"
                  autoComplete="current-password"
                  value={password.currentPassword}
                  onChange={(event) => setPassword((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))}
                />
                <PasswordField
                  label="Nova lozinka"
                  autoComplete="new-password"
                  value={password.newPassword}
                  onChange={(event) => setPassword((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))}
                />
                <PasswordField
                  label="Ponovite novu"
                  autoComplete="new-password"
                  value={password.again}
                  onChange={(event) => setPassword((current) => ({
                    ...current,
                    again: event.target.value,
                  }))}
                />
              </div>
              <div className="settings__actions">
                <button className="settings__primary" type="submit" disabled={savingPassword}>
                  {savingPassword ? 'Spremamo…' : 'Promijenite lozinku'}
                </button>
              </div>
            </form>

            <div className="settings__sheet settings__sheet--danger">
              <h2>Sesija</h2>
              <p className="settings__lead">Odjavom se briše lokalni pristup na ovom uređaju.</p>
              <button className="settings__danger-btn" type="button" onClick={logout}>
                Odjavite se
              </button>
            </div>
          </div>
        ) : null}

        {tab === 'privacy' ? (
          <div className="settings__stack">
            <article className="settings__sheet">
              <PrivacyConsentPanel />
            </article>
            <article className="settings__sheet">
              <h2>Podaci studija</h2>
              <p className="settings__lead">
                Podaci članova i rezervacija vezani su uz vaš studio i koriste se
                isključivo za rad aplikacije — prijave, termine i komunikaciju s članovima.
                Bez privole članovi mogu samo pregledavati sadržaj, ne i rezervirati.
              </p>
              <ul className="settings__rules">
                <li>Članovi koje upišete vide samo svoju stranicu i termine.</li>
                <li>Kontakt i radno vrijeme prikazuju se na javnoj stranici studija.</li>
                <li>Lozinke se ne spremaju u čitljivom obliku.</li>
                <li>Povlačenjem privole banner se ponovno prikazuje dok se privola ne da.</li>
              </ul>
            </article>
            <form className="settings__sheet settings__legal" onSubmit={requestSaveLegal}>
              <h2>Pravila studija</h2>
              <p className="settings__lead">
                Gotovi tekstovi (GDPR / RH) već su u bazi od registracije. Uredite ih samo ako
                trebate — inače ostavite predložak. Vi ste voditelj obrade; anyminutes je
                platforma. Nije formalni pravni savjet.
              </p>
              {legalUpdatedAt ? (
                <p className="settings__fine">
                  Zadnja izmjena u bazi:
                  {' '}
                  {legalUpdatedAt}
                </p>
              ) : null}

              <div className="settings__legal-tabs" role="tablist" aria-label="Dokumenti studija">
                {LEGAL_DOCS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={legalTab === item.id}
                    className={legalTab === item.id ? 'is-on' : undefined}
                    onClick={() => setLegalTab(item.id)}
                  >
                    <span>{item.index}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="settings__actions settings__legal-tools">
                <button className="settings__ghost" type="button" onClick={fillLegalTemplate}>
                  Vrati gotovi predložak
                </button>
                {studio.slug ? (
                  <Link
                    className="settings__ghost"
                    to={`/s/${studio.slug}/${legalTab === 'privacy' ? 'privatnost' : legalTab === 'terms' ? 'uvjeti' : 'kolacici'}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Pregled na stranici
                  </Link>
                ) : null}
              </div>

              <label>
                {activeLegalDoc.title}
                <textarea
                  rows={12}
                  value={legal[legalTab]}
                  onChange={(event) => setLegal((current) => ({
                    ...current,
                    [legalTab]: event.target.value,
                  }))}
                />
              </label>

              <div className="settings__actions">
                <button className="settings__primary" type="submit" disabled={savingLegal}>
                  {savingLegal ? 'Spremamo…' : 'Spremi pravila studija'}
                </button>
              </div>
            </form>

            {legalConfirmOpen ? (
              <div
                className="settings__modal"
                role="presentation"
                onClick={(event) => {
                  if (event.target === event.currentTarget && !savingLegal) {
                    setLegalConfirmOpen(false);
                  }
                }}
              >
                <div
                  className="settings__modal-panel"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="settings-legal-confirm-title"
                >
                  <h2 id="settings-legal-confirm-title">Spremiti izmjene pravila?</h2>
                  <p>
                    Jeste li sigurni da želite spremiti izmjene privatnosti, uvjeta i kolačića
                    u bazu? Tekst će odmah biti vidljiv na stranici studija.
                  </p>
                  <div className="settings__modal-actions">
                    <button
                      type="button"
                      className="settings__ghost"
                      disabled={savingLegal}
                      onClick={() => setLegalConfirmOpen(false)}
                    >
                      Odustani
                    </button>
                    <button
                      type="button"
                      className="settings__primary"
                      disabled={savingLegal}
                      onClick={confirmSaveLegal}
                    >
                      {savingLegal ? 'Spremamo…' : 'Da, spremi'}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            <article className="settings__sheet">
              <h2>Pravila platforme</h2>
              <p className="settings__lead">
                Odvojeno od studija — obostrana zaštita: vi pokrivate klijente studija,
                anyminutes pokriva rad aplikacije.
              </p>
              <ul className="settings__links">
                <li><Link to="/privatnost">Privatnost</Link></li>
                <li><Link to="/uvjeti">Uvjeti korištenja</Link></li>
                <li><Link to="/kolacici">Kolačići</Link></li>
              </ul>
            </article>
          </div>
        ) : null}

        {tab === 'billing' ? (
          <div className="settings__stack">
            <article className="settings__sheet">
              <div className="settings__plan">
                <div>
                  <em>Trenutni plan</em>
                  <strong>Starter</strong>
                  <p>Pilotot: članovi, termini i kalendar bez online naplate.</p>
                </div>
                <span className="settings__pill">Aktivno</span>
              </div>
              <ul className="settings__rules">
                <li>Članovi i članarine</li>
                <li>Kalendar rezervacija</li>
                <li>Radno vrijeme i kontakt</li>
                <li className="is-muted">Online plaćanje — kasnije</li>
              </ul>
            </article>
            <article className="settings__sheet">
              <h2>Naplata</h2>
              <p className="settings__lead">
                Kartice, računi i salonska blagajna nisu dio trenutačnog pilota.
                Online naplata dolazi kasnije.
              </p>
            </article>
          </div>
        ) : null}

        {tab === 'notifications' ? (
          <form className="settings__sheet settings__sheet--notify" onSubmit={savePrefs}>
            <article className="settings__notify-channel">
              <header className="settings__notify-head">
                <span className="settings__notify-index" aria-hidden="true">01</span>
                <div>
                  <p className="settings__notify-kicker">Kanal</p>
                  <h2>E-pošta</h2>
                  <p className="settings__lead">
                    Obavijesti na adresu vlasnika — rezervacije, otkazi i članovi.
                  </p>
                </div>
                <p className="settings__notify-meta">
                  <strong>{emailPrefsOn}</strong>
                  <span>uključeno</span>
                </p>
              </header>
              <ul className="settings__toggles">
                {[
                  ['bookingEmail', 'Nova rezervacija', 'E-pošta kad netko rezervira termin'],
                  ['cancelEmail', 'Otkaz termina', 'E-pošta kad član ili trener otkaže rezervaciju'],
                  ['memberEmail', 'Novi član', 'Obavijest kad dodate ili obnovite člana'],
                  ['weeklyDigest', 'Tjedni sažetak', 'Jednom tjedno pregled popunjenosti'],
                  ['marketing', 'Novosti proizvoda', 'Rijetke obavijesti o anyminutesu'],
                ].map(([key, title, noteText]) => (
                  <li key={key}>
                    <div>
                      <strong>{title}</strong>
                      <span>{noteText}</span>
                    </div>
                    <label className="settings__switch">
                      <input
                        type="checkbox"
                        checked={Boolean(prefs[key])}
                        onChange={(event) => setPrefs((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))}
                      />
                      <span />
                    </label>
                  </li>
                ))}
              </ul>
            </article>

            <article className="settings__notify-channel settings__notify-channel--push">
              <header className="settings__notify-head">
                <span className="settings__notify-index" aria-hidden="true">02</span>
                <div>
                  <p className="settings__notify-kicker">Kanal</p>
                  <h2>Push na uređaj</h2>
                  <p className="settings__lead">
                    Web Push u pregledniku — i na mobitelu kad instalirate anyminutes kao app.
                  </p>
                </div>
                <p className="settings__notify-meta">
                  <strong>{pushPrefsOn}</strong>
                  <span>uključeno</span>
                </p>
              </header>

              <div
                className={`settings__notify-device${pushState.subscribed ? ' is-live' : ''}${!pushState.supported ? ' is-blocked' : ''}`}
              >
                <div className="settings__notify-device-copy">
                  <p className="settings__notify-kicker">Ovaj uređaj</p>
                  <strong>
                    {pushState.subscribed
                      ? 'Obavijesti su uključene'
                      : pushState.supported
                        ? 'Obavijesti nisu uključene'
                        : 'Obavijesti nisu dostupne'}
                  </strong>
                  <p className="settings__fine">
                    {!pushState.supported
                      ? 'Ovaj preglednik ne podržava push. Na iPhoneu prvo dodajte anyminutes na početni zaslon.'
                      : pushState.subscribed
                        ? 'Ovaj uređaj vas obavještava o novim rezervacijama, otkazima i članovima.'
                        : pushState.permission === 'denied'
                          ? 'Preglednik je blokirao obavijesti. Uključite ih u postavkama stranice, pa pokušajte ponovno.'
                          : 'Kliknite na gumb kako biste uključili obavijesti na ovom uređaju i bili u toku s novim rezervacijama.'}
                  </p>
                </div>
                <button
                  className={pushState.subscribed ? 'settings__ghost' : 'settings__primary'}
                  type="button"
                  disabled={pushBusy || !pushState.supported}
                  onClick={toggleDevicePush}
                >
                  {pushBusy
                    ? 'Pripremamo…'
                    : pushState.subscribed
                      ? 'Isključite na ovom uređaju'
                      : 'Uključite na ovom uređaju'}
                </button>
              </div>

              <ul className="settings__toggles">
                {[
                  ['bookingPush', 'Nova rezervacija', 'Push kad član rezervira termin'],
                  ['cancelPush', 'Otkaz termina', 'Push kad netko otkaže rezervaciju'],
                  ['memberPush', 'Promjena članarine', 'Push kad dodate ili obnovite člana'],
                  ['reminderPush', 'Podsjetnik prije termina', 'Push prije početka treninga (uskoro)'],
                ].map(([key, title, noteText]) => (
                  <li key={key}>
                    <div>
                      <strong>{title}</strong>
                      <span>{noteText}</span>
                    </div>
                    <label className="settings__switch">
                      <input
                        type="checkbox"
                        checked={Boolean(prefs[key])}
                        onChange={(event) => setPrefs((current) => ({
                          ...current,
                          [key]: event.target.checked,
                        }))}
                      />
                      <span />
                    </label>
                  </li>
                ))}
              </ul>
            </article>

            <footer className="settings__notify-foot">
              <p className="settings__fine">
                Odabir se sprema na vaš račun i lokalno na uređaju.
              </p>
              <button className="settings__primary" type="submit">
                Spremite obavijesti
              </button>
            </footer>
          </form>
        ) : null}
      </div>
    </section>
  );
}
