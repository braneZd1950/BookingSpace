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
  INITIAL_MEMBER_PASSWORD_FORM,
  LEGAL_LINKS,
  MEMBER_NOTIFY_SECTIONS,
  MEMBER_SETTINGS_ACTIONS,
  MEMBER_SETTINGS_MESSAGES,
  emailStatusLabel,
  memberAccountFromUser,
  mergeMemberNotifyPrefs,
  patchMemberNotifyPref,
} from '../../../../shared/memberAccountSettings.js';
import {
  changeMemberPassword,
  createMemberSettingsFeedback,
  deleteMemberAccount,
  resendMemberEmailChange,
  saveMemberAccount,
  saveMemberEmailChange,
  saveMemberNotificationPrefs,
  saveMemberUiTheme,
} from '../../../../shared/memberSettingsHandlers.js';
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
  const [password, setPassword] = useState(INITIAL_MEMBER_PASSWORD_FORM);
  const [deleteForm, setDeleteForm] = useState({ password: '', confirm: '' });
  const [notes, setNotes] = useState({});
  const [errors, setErrors] = useState({});
  const feedback = createMemberSettingsFeedback(setNotes, setErrors);

  useEffect(() => {
    if (!user) return;
    setAccount(memberAccountFromUser(user));
    setEmailDraft('');
    setUiTheme(normalizeUiTheme(user.uiTheme));
    setPrefs(mergeMemberNotifyPrefs(user.notificationPrefs));
  }, [user]);

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
    await saveMemberAccount(account, (payload) => updateMe(payload).unwrap(), feedback);
  }

  async function requestEmailChange(event) {
    event.preventDefault();
    await saveMemberEmailChange(
      emailDraft,
      user?.email,
      (payload) => updateMe(payload).unwrap(),
      feedback,
      () => setEmailDraft(''),
    );
  }

  async function onResendEmail() {
    await resendMemberEmailChange(() => resendEmail().unwrap(), feedback);
  }

  async function saveUiTheme(next) {
    await saveMemberUiTheme(next, {
      normalizeUiTheme,
      syncUiTheme,
      updateMe: (payload) => updateMe(payload).unwrap(),
      feedback,
      onApply: setUiTheme,
    });
  }

  async function savePrefs(event) {
    event.preventDefault();
    await saveMemberNotificationPrefs(
      prefs,
      (payload) => updateMe(payload).unwrap(),
      feedback,
    );
  }

  async function savePassword(event) {
    event.preventDefault();
    await changeMemberPassword(
      password,
      (payload) => changePassword(payload).unwrap(),
      feedback,
      {
        onToken: (token) => { localStorage.setItem(TOKEN_KEY, token); },
        onReauth: () => clearSession({ dispatch }),
        resetPassword: () => setPassword(INITIAL_MEMBER_PASSWORD_FORM),
      },
    );
  }

  async function onLogoutAll() {
    feedback.setNote('security', '');
    try {
      await logoutAll().unwrap();
    } catch {
      /* still clear local */
    }
    await clearSession({ dispatch });
    feedback.setNote('security', MEMBER_SETTINGS_MESSAGES.logoutAllSuccess);
  }

  async function onExport() {
    feedback.clear('privacy');
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
      feedback.setNote('privacy', MEMBER_SETTINGS_MESSAGES.exportDownloaded);
    } catch {
      feedback.setError('privacy', MEMBER_SETTINGS_MESSAGES.exportFailed);
    }
  }

  async function onDeleteAccount(event) {
    event.preventDefault();
    if (!window.confirm(MEMBER_SETTINGS_MESSAGES.deleteConfirmWeb)) return;
    await deleteMemberAccount(
      Boolean(user?.hasPassword),
      user?.hasPassword ? deleteForm.password : deleteForm.confirm,
      (body) => deleteAccount(body).unwrap(),
      feedback,
      () => clearSession({ dispatch }),
    );
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
              {MEMBER_SETTINGS_MESSAGES.lead}
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
                {savingProfile ? MEMBER_SETTINGS_ACTIONS.saving : MEMBER_SETTINGS_ACTIONS.saveAccount}
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
                {MEMBER_SETTINGS_ACTIONS.sendEmailConfirm}
              </button>
              {user?.pendingEmail ? (
                <button
                  type="button"
                  className="member-settings__ghost"
                  disabled={resendingEmail}
                  onClick={() => { void onResendEmail(); }}
                >
                  {resendingEmail ? MEMBER_SETTINGS_ACTIONS.sending : MEMBER_SETTINGS_ACTIONS.resendEmail}
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
            {MEMBER_NOTIFY_SECTIONS.map((group) => (
              <div key={group.id}>
                <h3 className="member-settings__subhead">{group.heading}</h3>
                {group.hint ? (
                  <p className="member-settings__hint">{group.hint}</p>
                ) : null}
                <ul className="member-settings__toggles">
                  {group.options.map((option) => (
                    <li key={option.key}>
                      <label className="member-settings__toggle" aria-label={option.label}>
                        <input
                          type="checkbox"
                          checked={Boolean(prefs[option.key])}
                          onChange={(event) => setPrefs(
                            patchMemberNotifyPref(option.key, event.target.checked),
                          )}
                        />
                        <span>
                          <strong>{option.label}</strong>
                          <em>{option.hint}</em>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {notes.prefs ? (
              <p className="member-settings__note" role="status">{notes.prefs}</p>
            ) : null}
            <div className="member-settings__actions">
              <button type="submit" className="member-settings__primary" disabled={savingProfile}>
                {savingProfile ? MEMBER_SETTINGS_ACTIONS.saving : MEMBER_SETTINGS_ACTIONS.savePrefs}
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
                {MEMBER_SETTINGS_MESSAGES.googleAuthNoPassword}
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
                    {savingPassword ? MEMBER_SETTINGS_ACTIONS.saving : MEMBER_SETTINGS_ACTIONS.changePassword}
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
                {loggingOutAll ? MEMBER_SETTINGS_ACTIONS.loggingOut : MEMBER_SETTINGS_ACTIONS.logoutAll}
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
                {exporting ? MEMBER_SETTINGS_ACTIONS.preparing : MEMBER_SETTINGS_ACTIONS.exportData}
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
                  {deleting ? MEMBER_SETTINGS_ACTIONS.deleting : MEMBER_SETTINGS_ACTIONS.deleteAccount}
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
