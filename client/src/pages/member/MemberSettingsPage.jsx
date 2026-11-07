import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useChangePasswordMutation,
  useGetMeQuery,
  useUpdateMeMutation,
} from '../../api/authApi.js';
import PrivacyConsentPanel from '../../components/PrivacyConsentPanel.jsx';
import UiThemePicker from '../../components/UiThemePicker.jsx';
import { clearSession } from '../../lib/clearSession.js';
import { normalizeUiTheme, syncUiTheme } from '../../lib/uiTheme.js';
import './MemberSettingsPage.scss';

const TOKEN_KEY = 'bookingspace.token';

const DEFAULT_PREFS = {
  bookingEmail: true,
  cancelEmail: true,
  marketing: false,
  reminderPush: false,
};

const NOTIFY_OPTIONS = [
  {
    key: 'bookingEmail',
    label: 'Potvrda rezervacije',
    hint: 'E-pošta kad rezervirate termin',
  },
  {
    key: 'cancelEmail',
    label: 'Otkazivanje',
    hint: 'E-pošta kad se termin otkaže',
  },
  {
    key: 'marketing',
    label: 'Novosti',
    hint: 'Povremene obavijesti studija i platforme',
  },
  {
    key: 'reminderPush',
    label: 'Podsjetnik',
    hint: 'Push prije početka termina (uskoro)',
  },
];

const SECTIONS = [
  { id: 'racun', index: '01', label: 'Račun' },
  { id: 'tema', index: '02', label: 'Tema' },
  { id: 'obavijesti', index: '03', label: 'Obavijesti' },
  { id: 'lozinka', index: '04', label: 'Lozinka' },
  { id: 'privola', index: '05', label: 'Privola' },
];

function PasswordField({ label, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const tip = visible ? 'Sakrij lozinku' : 'Prikaži lozinku';

  return (
    <label className="member-settings__field member-settings__field--password">
      <span>{label}</span>
      <span className="member-settings__password-wrap">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
        />
        <button
          type="button"
          className="member-settings__eye"
          onClick={() => setVisible((current) => !current)}
          title={tip}
          aria-label={tip}
        >
          {visible ? 'Sakrij' : 'Prikaži'}
        </button>
      </span>
    </label>
  );
}

export default function MemberSettingsPage() {
  const dispatch = useDispatch();
  const { tenant, loggedIn, palette } = useOutletContext();
  const base = `/s/${tenant.slug}`;
  const theme = palette?.theme;
  const { data: meData } = useGetMeQuery(undefined, { skip: !loggedIn });
  const [updateMe, { isLoading: savingProfile }] = useUpdateMeMutation();
  const [changePassword, { isLoading: savingPassword }] = useChangePasswordMutation();

  const [account, setAccount] = useState({ name: '', email: '', phone: '' });
  const [uiTheme, setUiTheme] = useState('system');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    again: '',
  });
  const [notes, setNotes] = useState({
    account: '',
    theme: '',
    prefs: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    account: '',
    password: '',
  });

  useEffect(() => {
    const user = meData?.user;
    if (!user) return;
    setAccount({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setUiTheme(normalizeUiTheme(user.uiTheme));
    setPrefs({ ...DEFAULT_PREFS, ...(user.notificationPrefs || {}) });
  }, [meData?.user]);

  function setNote(key, text) {
    setNotes((current) => ({ ...current, [key]: text }));
  }

  function setError(key, text) {
    setErrors((current) => ({ ...current, [key]: text }));
  }

  async function saveAccount(event) {
    event.preventDefault();
    setError('account', '');
    setNote('account', '');
    const name = account.name.trim();
    const email = account.email.trim().toLowerCase();
    if (!name || !email) {
      setError('account', 'Ime i e-pošta su obavezni.');
      return;
    }
    try {
      await updateMe({
        name,
        email,
        phone: account.phone.trim() || undefined,
      }).unwrap();
      setNote('account', 'Račun je spremljen.');
    } catch (err) {
      const message = err?.data?.message || 'Račun nije spremljen. Pokušajte ponovno.';
      setError('account', message);
    }
  }

  async function saveUiTheme(next) {
    const value = normalizeUiTheme(next);
    setUiTheme(value);
    syncUiTheme(value);
    setNote('theme', '');
    try {
      await updateMe({ uiTheme: value }).unwrap();
      setNote('theme', value === 'dark'
        ? 'Tamna tema je spremljena na račun.'
        : value === 'light'
          ? 'Svijetla tema je spremljena na račun.'
          : 'Tema uređaja je spremljena na račun.');
    } catch {
      setNote('theme', 'Tema ostaje lokalno — nije spremljena na račun.');
    }
  }

  async function savePrefs(event) {
    event.preventDefault();
    setNote('prefs', '');
    try {
      await updateMe({
        notificationPrefs: {
          bookingEmail: Boolean(prefs.bookingEmail),
          cancelEmail: Boolean(prefs.cancelEmail),
          marketing: Boolean(prefs.marketing),
          reminderPush: Boolean(prefs.reminderPush),
        },
      }).unwrap();
      setNote('prefs', 'Obavijesti su spremljene.');
    } catch {
      setNote('prefs', 'Obavijesti nisu spremljene. Pokušajte ponovno.');
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setError('password', '');
    setNote('password', '');
    if (password.newPassword.length < 8) {
      setError('password', 'Nova lozinka mora imati barem 8 znakova.');
      return;
    }
    if (password.newPassword !== password.again) {
      setError('password', 'Nova lozinka i ponavljanje se ne podudaraju.');
      return;
    }
    try {
      const result = await changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      }).unwrap();
      // Server bumps tokenVersion — keep the fresh JWT or the session dies.
      if (result?.token) {
        localStorage.setItem(TOKEN_KEY, result.token);
      } else {
        await clearSession({ dispatch });
        setNote('password', 'Lozinka je promijenjena — prijavite se ponovo.');
        setPassword({ currentPassword: '', newPassword: '', again: '' });
        return;
      }
      setPassword({ currentPassword: '', newPassword: '', again: '' });
      setNote('password', 'Lozinka je promijenjena.');
    } catch (err) {
      const message = err?.data?.message || 'Lozinka nije promijenjena. Provjerite trenutnu lozinku.';
      setError('password', message);
    }
  }

  if (!loggedIn) {
    return (
      <main className="member-settings member-settings--gate">
        <h1>Postavke</h1>
        <p>
          Prijavite se da upravljate temom, računom i obavijestima.
          {' '}
          <Link to="/login">Prijava</Link>
        </p>
      </main>
    );
  }

  return (
    <main
      className="member-settings"
      style={theme ? {
        '--settings-brand': theme.primaryColor,
        '--settings-soft': 'var(--site-soft, var(--brand-soft))',
      } : undefined}
    >
      <div className="member-settings__atmosphere" aria-hidden="true">
        <span className="member-settings__wash" />
        <span className="member-settings__grain" />
      </div>

      <div className="member-settings__layout">
        <aside className="member-settings__rail">
          <p className="member-settings__rail-mark">Postavke</p>
          <nav className="member-settings__index" aria-label="Odjeljci postavki">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                <span className="member-settings__index-num">{section.index}</span>
                <span>{section.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="member-settings__stage">
          <header className="member-settings__hero">
            <p className="member-settings__studio">{tenant.name}</p>
            <p className="member-settings__kicker">Vaš račun</p>
            <h1>Postavke</h1>
            <p className="member-settings__lead">
              Tema, kontakt i obavijesti spremaju se na vaš račun i vrijede na svim uređajima
              nakon prijave.
            </p>
          </header>

          <form
            id="racun"
            className="member-settings__sheet"
            onSubmit={saveAccount}
          >
            <h2>Račun</h2>
            <p className="member-settings__sheet-lead">
              Ime i e-pošta za prijavu — sprema se u bazu za vaš profil.
            </p>
            <div className="member-settings__grid">
              <label className="member-settings__field">
                <span>Ime i prezime</span>
                <input
                  value={account.name}
                  onChange={(event) => setAccount((current) => ({
                    ...current,
                    name: event.target.value,
                  }))}
                  autoComplete="name"
                  maxLength={80}
                  required
                />
              </label>
              <label className="member-settings__field">
                <span>Telefon</span>
                <input
                  value={account.phone}
                  onChange={(event) => setAccount((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))}
                  autoComplete="tel"
                  maxLength={30}
                />
              </label>
              <label className="member-settings__field member-settings__field--full">
                <span>E-pošta za prijavu</span>
                <input
                  type="email"
                  value={account.email}
                  onChange={(event) => setAccount((current) => ({
                    ...current,
                    email: event.target.value,
                  }))}
                  autoComplete="email"
                  required
                />
              </label>
            </div>
            {errors.account ? (
              <p className="member-settings__note is-err" role="alert">{errors.account}</p>
            ) : null}
            {notes.account ? (
              <p className="member-settings__note" role="status">{notes.account}</p>
            ) : null}
            <div className="member-settings__actions">
              <button type="submit" className="member-settings__primary" disabled={savingProfile}>
                {savingProfile ? 'Spremamo…' : 'Spremi račun'}
              </button>
            </div>
          </form>

          <section id="tema" className="member-settings__sheet" aria-label="Tema sučelja">
            <UiThemePicker
              value={uiTheme}
              onChange={saveUiTheme}
              disabled={savingProfile}
            />
            {notes.theme ? (
              <p className="member-settings__note" role="status">{notes.theme}</p>
            ) : null}
          </section>

          <form
            id="obavijesti"
            className="member-settings__sheet"
            onSubmit={savePrefs}
          >
            <h2>Obavijesti</h2>
            <p className="member-settings__sheet-lead">
              Što želite primati u vezi rezervacija i podsjetnika.
            </p>
            <ul className="member-settings__toggles">
              {NOTIFY_OPTIONS.map((option) => (
                <li key={option.key}>
                  <label className="member-settings__toggle" aria-label={option.label}>
                    <input
                      type="checkbox"
                      checked={Boolean(prefs[option.key])}
                      onChange={(event) => setPrefs((current) => ({
                        ...current,
                        [option.key]: event.target.checked,
                      }))}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <em>{option.hint}</em>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {notes.prefs ? (
              <p className="member-settings__note" role="status">{notes.prefs}</p>
            ) : null}
            <div className="member-settings__actions">
              <button type="submit" className="member-settings__primary" disabled={savingProfile}>
                {savingProfile ? 'Spremamo…' : 'Spremi obavijesti'}
              </button>
            </div>
          </form>

          <form
            id="lozinka"
            className="member-settings__sheet"
            onSubmit={savePassword}
          >
            <h2>Lozinka</h2>
            <p className="member-settings__sheet-lead">
              Koristite jaku lozinku koju ne dijelite s drugima.
            </p>
            <div className="member-settings__grid">
              <PasswordField
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
            {errors.password ? (
              <p className="member-settings__note is-err" role="alert">{errors.password}</p>
            ) : null}
            {notes.password ? (
              <p className="member-settings__note" role="status">{notes.password}</p>
            ) : null}
            <div className="member-settings__actions">
              <button type="submit" className="member-settings__primary" disabled={savingPassword}>
                {savingPassword ? 'Spremamo…' : 'Promijeni lozinku'}
              </button>
            </div>
          </form>

          <section id="privola" className="member-settings__sheet" aria-label="Privola">
            <h2>Privola</h2>
            <p className="member-settings__sheet-lead">
              Upravljanje privolom za
              {' '}
              {tenant.name}
              {' '}
              i anyminutes.
            </p>
            <PrivacyConsentPanel />
          </section>

          <p className="member-settings__back">
            <Link to={base}>Natrag na {tenant.name}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
