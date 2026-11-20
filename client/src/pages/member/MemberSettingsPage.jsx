import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  useChangePasswordMutation,
  useDeleteMyAccountMutation,
  useGetMeQuery,
  useLazyExportMyDataQuery,
  useLogoutAllMutation,
  useResendEmailChangeMutation,
  useUpdateMeMutation,
} from '../../api/authApi.js';
import PasswordField from '../../components/PasswordField.jsx';
import PrivacyConsentPanel from '../../components/PrivacyConsentPanel.jsx';
import UiThemePicker from '../../components/UiThemePicker.jsx';
import { clearSession } from '../../lib/clearSession.js';
import { normalizeUiTheme, syncUiTheme } from '../../lib/uiTheme.js';
import {
  ACCOUNT_SETTINGS_SECTIONS,
  LEGAL_LINKS,
  OPERATIONAL_NOTIFY_OPTIONS,
  PROMOTIONAL_NOTIFY_OPTIONS,
  emailStatusLabel,
  mergeMemberNotifyPrefs,
} from '../../../../shared/memberAccountSettings.js';
import './MemberSettingsPage.scss';

const TOKEN_KEY = 'bookingspace.token';

export default function MemberSettingsPage() {
  const dispatch = useDispatch();
  const { tenant, loggedIn, palette } = useOutletContext();
  const base = `/s/${tenant.slug}`;
  const theme = palette?.theme;
  const { data: meData } = useGetMeQuery(undefined, { skip: !loggedIn });
  const [updateMe, { isLoading: savingProfile }] = useUpdateMeMutation();
  const [changePassword, { isLoading: savingPassword }] = useChangePasswordMutation();
  const [resendEmail, { isLoading: resendingEmail }] = useResendEmailChangeMutation();
  const [logoutAll, { isLoading: loggingOutAll }] = useLogoutAllMutation();
  const [exportData, { isFetching: exporting }] = useLazyExportMyDataQuery();
  const [deleteAccount, { isLoading: deleting }] = useDeleteMyAccountMutation();

  const user = meData?.user;
  const stageRef = useRef(null);
  const [account, setAccount] = useState({ name: '', phone: '' });
  const [emailDraft, setEmailDraft] = useState('');
  const [uiTheme, setUiTheme] = useState('system');
  const [prefs, setPrefs] = useState(mergeMemberNotifyPrefs());
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    again: '',
  });
  const [deleteForm, setDeleteForm] = useState({ password: '', confirm: '' });
  const [notes, setNotes] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    setAccount({
      name: user.name || '',
      phone: user.phone || '',
    });
    setEmailDraft('');
    setUiTheme(normalizeUiTheme(user.uiTheme));
    setPrefs(mergeMemberNotifyPrefs(user.notificationPrefs));
  }, [user]);

  function setNote(key, text) {
    setNotes((current) => ({ ...current, [key]: text }));
  }

  function setError(key, text) {
    setErrors((current) => ({ ...current, [key]: text }));
  }

  function jumpToSection(event, sectionId) {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    const stage = stageRef.current;
    if (!target || !stage) return;
    const delta = target.getBoundingClientRect().top - stage.getBoundingClientRect().top;
    stage.scrollTo({ top: Math.max(0, stage.scrollTop + delta - 12), behavior: 'smooth' });
  }

  async function saveAccount(event) {
    event.preventDefault();
    setError('account', '');
    setNote('account', '');
    const name = account.name.trim();
    if (!name) {
      setError('account', 'Ime i prezime su obavezni.');
      return;
    }
    try {
      await updateMe({
        name,
        phone: account.phone.trim() || undefined,
      }).unwrap();
      setNote('account', 'Osobni podaci su spremljeni.');
    } catch (err) {
      setError('account', err?.data?.message || 'Podaci nisu spremljeni.');
    }
  }

  async function requestEmailChange(event) {
    event.preventDefault();
    setError('email', '');
    setNote('email', '');
    const email = emailDraft.trim().toLowerCase();
    if (!email || email === user?.email) {
      setError('email', 'Unesite novu e-poštu različitu od trenutne.');
      return;
    }
    try {
      const result = await updateMe({ email }).unwrap();
      setEmailDraft('');
      setNote(
        'email',
        result?.user?.pendingEmail
          ? `Poslali smo potvrdu na ${result.user.pendingEmail}.`
          : 'Zahtjev za promjenu e-pošte je poslan.',
      );
    } catch (err) {
      setError('email', err?.data?.message || 'E-pošta nije ažurirana.');
    }
  }

  async function onResendEmail() {
    setError('email', '');
    setNote('email', '');
    try {
      const result = await resendEmail().unwrap();
      setNote('email', `Ponovno smo poslali potvrdu na ${result.pendingEmail}.`);
    } catch {
      setError('email', 'Ponovno slanje nije uspjelo.');
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
          marketingStudio: Boolean(prefs.marketingStudio),
          marketingPlatform: Boolean(prefs.marketingPlatform),
          marketing: Boolean(prefs.marketingStudio),
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
      setError('password', err?.data?.message || 'Lozinka nije promijenjena.');
    }
  }

  async function onLogoutAll() {
    setNote('security', '');
    try {
      await logoutAll().unwrap();
    } catch {
      /* still clear local */
    }
    await clearSession({ dispatch });
    setNote('security', 'Odjavljeni ste sa svih uređaja.');
  }

  async function onExport() {
    setError('privacy', '');
    setNote('privacy', '');
    try {
      const payload = await exportData().unwrap();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `blizari-podaci-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setNote('privacy', 'Izvoz je preuzet.');
    } catch {
      setError('privacy', 'Izvoz nije uspio.');
    }
  }

  async function onDeleteAccount(event) {
    event.preventDefault();
    setError('delete', '');
    setNote('delete', '');
    if (!window.confirm('Trajno ćete deaktivirati Blizari račun. Nastaviti?')) return;
    try {
      const body = user?.hasPassword
        ? { password: deleteForm.password }
        : { confirm: deleteForm.confirm };
      await deleteAccount(body).unwrap();
      await clearSession({ dispatch });
      setNote('delete', 'Račun je deaktiviran.');
    } catch (err) {
      setError('delete', err?.data?.message || 'Račun nije obrisan.');
    }
  }

  if (!loggedIn) {
    return (
      <main className="member-settings member-settings--gate">
        <h1>Postavke</h1>
        <p>
          Prijavite se da upravljate Blizari računom.
          {' '}
          <Link to="/login">Prijava</Link>
        </p>
      </main>
    );
  }

  const statusLine = emailStatusLabel({
    emailVerified: user?.emailVerified,
    pendingEmail: user?.pendingEmail,
  });

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
            {ACCOUNT_SETTINGS_SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(event) => jumpToSection(event, section.id)}
              >
                <span className="member-settings__index-num">{section.index}</span>
                <span>{section.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="member-settings__stage" ref={stageRef}>
          <header className="member-settings__hero">
            <p className="member-settings__studio">{tenant.name}</p>
            <p className="member-settings__kicker">Blizari račun</p>
            <h1>Postavke</h1>
            <p className="member-settings__lead">
              Opće postavke pripadaju vašem Blizari računu i sinkroniziraju se
              između uređaja. Članarine i rezervacije ostaju u studiju.
            </p>
          </header>

          <form id="osobni" className="member-settings__sheet" onSubmit={saveAccount}>
            <h2>Osobni podaci</h2>
            <p className="member-settings__sheet-lead">
              Ime, telefon i e-pošta za prijavu.
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
              <div className="member-settings__field member-settings__field--full">
                <span>E-pošta za prijavu</span>
                <p className="member-settings__readonly">{user?.email || '—'}</p>
                <p className="member-settings__hint">{statusLine}</p>
              </div>
            </div>
            {errors.account ? (
              <p className="member-settings__note is-err" role="alert">{errors.account}</p>
            ) : null}
            {notes.account ? (
              <p className="member-settings__note" role="status">{notes.account}</p>
            ) : null}
            <div className="member-settings__actions">
              <button type="submit" className="member-settings__primary" disabled={savingProfile}>
                {savingProfile ? 'Spremamo…' : 'Spremi podatke'}
              </button>
            </div>
          </form>

          <form className="member-settings__sheet" onSubmit={requestEmailChange}>
            <h2>Promjena e-pošte</h2>
            <p className="member-settings__sheet-lead">
              Nova adresa se aktivira tek nakon potvrde linkom iz poruke.
            </p>
            <div className="member-settings__grid">
              <label className="member-settings__field member-settings__field--full">
                <span>Nova e-pošta</span>
                <input
                  type="email"
                  value={emailDraft}
                  onChange={(event) => setEmailDraft(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
            </div>
            {errors.email ? (
              <p className="member-settings__note is-err" role="alert">{errors.email}</p>
            ) : null}
            {notes.email ? (
              <p className="member-settings__note" role="status">{notes.email}</p>
            ) : null}
            <div className="member-settings__actions">
              <button type="submit" className="member-settings__primary" disabled={savingProfile}>
                Pošalji potvrdu
              </button>
              {user?.pendingEmail ? (
                <button
                  type="button"
                  className="member-settings__ghost"
                  disabled={resendingEmail}
                  onClick={() => { void onResendEmail(); }}
                >
                  {resendingEmail ? 'Šaljemo…' : 'Pošalji ponovno'}
                </button>
              ) : null}
            </div>
          </form>

          <section id="izgled" className="member-settings__sheet" aria-label="Izgled">
            <h2>Izgled aplikacije</h2>
            <p className="member-settings__sheet-lead">
              Odabir se sprema na račun i vrijedi na drugim uređajima.
            </p>
            <UiThemePicker
              value={uiTheme}
              onChange={saveUiTheme}
              disabled={savingProfile}
            />
            {notes.theme ? (
              <p className="member-settings__note" role="status">{notes.theme}</p>
            ) : null}
          </section>

          <form id="obavijesti" className="member-settings__sheet" onSubmit={savePrefs}>
            <h2>Obavijesti</h2>
            <p className="member-settings__sheet-lead">
              Operativne obavijesti o terminima i zasebne promotivne opcije.
              Push kanali još nisu dostupni za klijente.
            </p>
            <h3 className="member-settings__subhead">Operativne (e-pošta)</h3>
            <ul className="member-settings__toggles">
              {OPERATIONAL_NOTIFY_OPTIONS.map((option) => (
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
            <h3 className="member-settings__subhead">Promotivne (e-pošta)</h3>
            <p className="member-settings__hint">
              Marketinške opcije nisu unaprijed uključene. Povlačenje ne blokira rezervacije.
            </p>
            <ul className="member-settings__toggles">
              {PROMOTIONAL_NOTIFY_OPTIONS.map((option) => (
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

          <section id="sigurnost" className="member-settings__sheet" aria-label="Sigurnost">
            <h2>Sigurnost</h2>
            <p className="member-settings__sheet-lead">
              Promjena lozinke i odjava sa svih uređaja. Pojedinačne sesije
              uređaja trenutačno nisu dostupne za pregled.
            </p>
            {user?.hasPassword === false ? (
              <p className="member-settings__hint">
                Ovaj račun koristi Google prijavu — lozinka se ne postavlja ovdje.
              </p>
            ) : (
              <form onSubmit={savePassword}>
                <div className="member-settings__grid">
                  <PasswordField
                    label="Trenutna lozinka"
                    className="member-settings__field member-settings__field--password"
                    wrapClassName="member-settings__password-wrap"
                    buttonClassName="member-settings__eye"
                    textToggle
                    autoComplete="current-password"
                    value={password.currentPassword}
                    onChange={(event) => setPassword((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))}
                  />
                  <PasswordField
                    label="Nova lozinka"
                    className="member-settings__field member-settings__field--password"
                    wrapClassName="member-settings__password-wrap"
                    buttonClassName="member-settings__eye"
                    textToggle
                    autoComplete="new-password"
                    value={password.newPassword}
                    onChange={(event) => setPassword((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))}
                  />
                  <PasswordField
                    label="Ponovite novu"
                    className="member-settings__field member-settings__field--password"
                    wrapClassName="member-settings__password-wrap"
                    buttonClassName="member-settings__eye"
                    textToggle
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
            )}
            <div className="member-settings__actions">
              <button
                type="button"
                className="member-settings__ghost"
                disabled={loggingOutAll}
                onClick={() => { void onLogoutAll(); }}
              >
                {loggingOutAll ? 'Odjavljujemo…' : 'Odjava sa svih uređaja'}
              </button>
            </div>
            {notes.security ? (
              <p className="member-settings__note" role="status">{notes.security}</p>
            ) : null}
          </section>

          <section id="privatnost" className="member-settings__sheet" aria-label="Privatnost">
            <h2>Privatnost i osobni podaci</h2>
            <p className="member-settings__sheet-lead">
              Pregled privole, izvoz podataka i brisanje računa.
            </p>
            <PrivacyConsentPanel />
            <div className="member-settings__actions">
              <button
                type="button"
                className="member-settings__primary"
                disabled={exporting}
                onClick={() => { void onExport(); }}
              >
                {exporting ? 'Pripremamo…' : 'Izvezi osobne podatke'}
              </button>
            </div>
            {errors.privacy ? (
              <p className="member-settings__note is-err" role="alert">{errors.privacy}</p>
            ) : null}
            {notes.privacy ? (
              <p className="member-settings__note" role="status">{notes.privacy}</p>
            ) : null}

            <form className="member-settings__danger" onSubmit={onDeleteAccount}>
              <h3 className="member-settings__subhead">Brisanje računa</h3>
              <p className="member-settings__hint">
                Račun se deaktivira i osobni podaci se anonimiziraju. Rezervacije
                studija mogu ostati bez vaših osobnih podataka.
              </p>
              {user?.hasPassword === false ? (
                <label className="member-settings__field">
                  <span>Upišite DELETE za potvrdu</span>
                  <input
                    value={deleteForm.confirm}
                    onChange={(event) => setDeleteForm((current) => ({
                      ...current,
                      confirm: event.target.value,
                    }))}
                    required
                  />
                </label>
              ) : (
                <PasswordField
                  label="Lozinka za potvrdu"
                  className="member-settings__field member-settings__field--password"
                  wrapClassName="member-settings__password-wrap"
                  buttonClassName="member-settings__eye"
                  textToggle
                  autoComplete="current-password"
                  value={deleteForm.password}
                  onChange={(event) => setDeleteForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))}
                />
              )}
              {errors.delete ? (
                <p className="member-settings__note is-err" role="alert">{errors.delete}</p>
              ) : null}
              {notes.delete ? (
                <p className="member-settings__note" role="status">{notes.delete}</p>
              ) : null}
              <div className="member-settings__actions">
                <button type="submit" className="member-settings__danger-btn" disabled={deleting}>
                  {deleting ? 'Brišemo…' : 'Obriši račun'}
                </button>
              </div>
            </form>
          </section>

          <section id="pravno" className="member-settings__sheet" aria-label="Pravne informacije">
            <h2>Pravne informacije</h2>
            <p className="member-settings__sheet-lead">
              Produkcijski dokumenti Blizaria.
            </p>
            <ul className="member-settings__legal">
              {LEGAL_LINKS.map((item) => (
                <li key={item.id}>
                  <a href={item.href} target="_blank" rel="noreferrer">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="member-settings__back">
            <Link to={base}>
              Natrag na
              {' '}
              {tenant.name}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
