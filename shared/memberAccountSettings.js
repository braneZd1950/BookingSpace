/** Shared member account settings — web + mobile. */

export const ACCOUNT_SETTINGS_SECTIONS = [
  { id: 'osobni', index: '01', label: 'Osobni podaci' },
  { id: 'izgled', index: '02', label: 'Izgled' },
  { id: 'obavijesti', index: '03', label: 'Obavijesti' },
  { id: 'sigurnost', index: '04', label: 'Sigurnost' },
  { id: 'privatnost', index: '05', label: 'Privatnost' },
  { id: 'pravno', index: '06', label: 'Pravne informacije' },
];

export const DEFAULT_MEMBER_NOTIFY_PREFS = {
  bookingEmail: true,
  cancelEmail: true,
  marketingStudio: false,
  marketingPlatform: false,
};

/** Only channels that actually send today. */
export const OPERATIONAL_NOTIFY_OPTIONS = [
  {
    key: 'bookingEmail',
    label: 'Potvrda rezervacije',
    hint: 'E-pošta kad rezervirate termin',
    channel: 'email',
  },
  {
    key: 'cancelEmail',
    label: 'Otkazivanje rezervacije',
    hint: 'E-pošta kad se termin otkaže',
    channel: 'email',
  },
];

export const PROMOTIONAL_NOTIFY_OPTIONS = [
  {
    key: 'marketingStudio',
    label: 'Novosti poslovanja',
    hint: 'Obavijesti studija, salona ili drugog mjesta koje posjećujete',
    channel: 'email',
  },
  {
    key: 'marketingPlatform',
    label: 'Novosti Blizaria',
    hint: 'Povremene novosti i obavijesti platforme Blizari',
    channel: 'email',
  },
];

export const MEMBER_NOTIFY_SECTIONS = [
  {
    id: 'operational',
    heading: 'Operativne (e-pošta)',
    mobileLead: 'Operativne (e-pošta). Push još nije dostupan za klijente.',
    hint: null,
    options: OPERATIONAL_NOTIFY_OPTIONS,
  },
  {
    id: 'promotional',
    heading: 'Promotivne (e-pošta)',
    mobileLead: 'Promotivne (nisu unaprijed uključene).',
    hint: 'Marketinške opcije nisu unaprijed uključene. Povlačenje ne blokira rezervacije.',
    options: PROMOTIONAL_NOTIFY_OPTIONS,
  },
];

export const INITIAL_MEMBER_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  again: '',
};

export function patchMemberNotifyPref(key, value) {
  return (current) => ({ ...current, [key]: value });
}

export const BLIZARI_LEGAL = {
  website: 'https://blizari.com',
  privacy: 'https://blizari.com/privatnost',
  terms: 'https://blizari.com/uvjeti',
  cookies: 'https://blizari.com/kolacici',
  privacyContact: 'mailto:kontakt@blizari.com',
  privacyContactLabel: 'kontakt@blizari.com',
};

export const LEGAL_LINKS = [
  { id: 'privacy', label: 'Obavijest o privatnosti', href: BLIZARI_LEGAL.privacy },
  { id: 'terms', label: 'Uvjeti korištenja', href: BLIZARI_LEGAL.terms },
  { id: 'cookies', label: 'Pravila kolačića', href: BLIZARI_LEGAL.cookies },
  {
    id: 'contact',
    label: 'Kontakt za pitanja o privatnosti',
    href: BLIZARI_LEGAL.privacyContact,
  },
];

export function mergeMemberNotifyPrefs(raw = {}) {
  const marketingStudio = raw.marketingStudio !== undefined
    ? Boolean(raw.marketingStudio)
    : Boolean(raw.marketing);
  return {
    bookingEmail: raw.bookingEmail !== undefined
      ? Boolean(raw.bookingEmail)
      : DEFAULT_MEMBER_NOTIFY_PREFS.bookingEmail,
    cancelEmail: raw.cancelEmail !== undefined
      ? Boolean(raw.cancelEmail)
      : DEFAULT_MEMBER_NOTIFY_PREFS.cancelEmail,
    marketingStudio,
    marketingPlatform: Boolean(raw.marketingPlatform),
  };
}

export function emailStatusLabel({ emailVerified, pendingEmail } = {}) {
  if (pendingEmail) return `Čeka potvrdu: ${pendingEmail}`;
  if (emailVerified) return 'E-pošta je potvrđena';
  return 'E-pošta nije potvrđena';
}

export const UI_THEME_OPTIONS = [
  { value: 'light', label: 'Svijetla', hint: 'Uvijek svijetlo' },
  { value: 'dark', label: 'Tamna', hint: 'Uvijek tamno' },
  {
    value: 'system',
    label: 'Prema uređaju',
    hint: 'Prati postavku telefona ili računala',
  },
];

export const MEMBER_SETTINGS_MESSAGES = {
  nameRequired: 'Ime i prezime su obavezni.',
  emailUnchanged: 'Unesite novu e-poštu različitu od trenutne.',
  passwordTooShort: 'Nova lozinka mora imati barem 8 znakova.',
  passwordMismatch: 'Nova lozinka i ponavljanje se ne podudaraju.',
  prefsSaved: 'Obavijesti su spremljene.',
  accountSaved: 'Osobni podaci su spremljeni.',
  passwordSaved: 'Lozinka je promijenjena.',
  passwordSavedReauth: 'Lozinka je promijenjena — prijavite se ponovo.',
  themeLocalOnly: 'Tema ostaje lokalno — nije spremljena na račun.',
  accountSaveFailed: 'Podaci nisu spremljeni.',
  emailUpdateFailed: 'E-pošta nije ažurirana.',
  emailResendFailed: 'Ponovno slanje nije uspjelo.',
  emailChangeRequested: 'Zahtjev za promjenu e-pošte je poslan.',
  prefsSaveFailed: 'Obavijesti nisu spremljene. Pokušajte ponovno.',
  passwordChangeFailed: 'Lozinka nije promijenjena.',
  logoutAllSuccess: 'Odjavljeni ste sa svih uređaja.',
  exportFailed: 'Izvoz nije uspio.',
  exportDownloaded: 'Izvoz je preuzet.',
  exportShared: 'Izvoz je spreman za dijeljenje.',
  deleteFailed: 'Račun nije obrisan.',
  deleteSuccess: 'Račun je deaktiviran.',
  deleteConfirmWeb: 'Trajno ćete deaktivirati Blizari račun. Nastaviti?',
  deleteConfirmTitle: 'Brisanje računa',
  deleteConfirmBody: 'Račun će se deaktivirati i osobni podaci anonimizirati.',
  googleAuthNoPassword: 'Račun je povezan preko Googlea — lozinka se ne postavlja ovdje.',
  lead: 'Opće postavke pripadaju vašem Blizari računu i sinkroniziraju se između uređaja. Članarine i rezervacije ostaju u studiju.',
  leadShort: 'Opće postavke pripadaju vašem Blizari računu i sinkroniziraju se između uređaja.',
};

export const MEMBER_SETTINGS_ACTIONS = {
  saving: 'Spremamo…',
  sending: 'Šaljemo…',
  preparing: 'Pripremamo…',
  deleting: 'Brišemo…',
  loggingOut: 'Odjavljujemo…',
  saveAccount: 'Spremi podatke',
  savePrefs: 'Spremi obavijesti',
  changePassword: 'Promijeni lozinku',
  sendEmailConfirm: 'Pošalji potvrdu',
  resendEmail: 'Pošalji ponovno',
  logoutAll: 'Odjava sa svih uređaja',
  exportData: 'Izvezi osobne podatke',
  deleteAccount: 'Obriši račun',
};

export function memberNotificationPrefsPayload(prefs = {}) {
  return {
    bookingEmail: Boolean(prefs.bookingEmail),
    cancelEmail: Boolean(prefs.cancelEmail),
    marketingStudio: Boolean(prefs.marketingStudio),
    marketingPlatform: Boolean(prefs.marketingPlatform),
    marketing: Boolean(prefs.marketingStudio),
  };
}

export function validateMemberAccountName(name) {
  if (!String(name || '').trim()) return MEMBER_SETTINGS_MESSAGES.nameRequired;
  return '';
}

export function validateMemberEmailChange(email, currentEmail) {
  const next = String(email || '').trim().toLowerCase();
  if (!next || next === String(currentEmail || '').trim().toLowerCase()) {
    return MEMBER_SETTINGS_MESSAGES.emailUnchanged;
  }
  return '';
}

export function validateMemberPasswordChange({ newPassword = '', again = '' } = {}) {
  if (String(newPassword).length < 8) return MEMBER_SETTINGS_MESSAGES.passwordTooShort;
  if (newPassword !== again) return MEMBER_SETTINGS_MESSAGES.passwordMismatch;
  return '';
}

export function uiThemeSavedMessage(theme) {
  if (theme === 'dark') return 'Tamna tema je spremljena na račun.';
  if (theme === 'light') return 'Svijetla tema je spremljena na račun.';
  return 'Tema uređaja je spremljena na račun.';
}

export function emailChangeSentMessage(pendingEmail) {
  return `Poslali smo potvrdu na ${pendingEmail}.`;
}

export function emailChangeResentMessage(pendingEmail) {
  return `Ponovno smo poslali potvrdu na ${pendingEmail}.`;
}

export function memberAccountFromUser(user = {}) {
  return {
    name: user.name || '',
    phone: user.phone || '',
  };
}

export function prepareAccountUpdate(account = {}) {
  const name = String(account.name || '').trim();
  const error = validateMemberAccountName(name);
  if (error) return { error };
  return {
    payload: {
      name,
      phone: String(account.phone || '').trim() || undefined,
    },
  };
}

export function prepareEmailChange(email, currentEmail) {
  const next = String(email || '').trim().toLowerCase();
  const error = validateMemberEmailChange(next, currentEmail);
  if (error) return { error };
  return { payload: { email: next } };
}

export function preparePasswordChange(password = {}) {
  const error = validateMemberPasswordChange(password);
  if (error) return { error };
  return {
    payload: {
      currentPassword: password.currentPassword,
      newPassword: password.newPassword,
    },
  };
}

export function emailChangeNoteFromResult(result, fallbackEmail) {
  const pending = result?.user?.pendingEmail || fallbackEmail;
  if (pending) return emailChangeSentMessage(pending);
  return MEMBER_SETTINGS_MESSAGES.emailChangeRequested;
}

export function buildDeleteAccountBody(hasPassword, secret) {
  return hasPassword
    ? { password: secret }
    : { confirm: secret };
}

export function apiErrorMessage(err, fallback) {
  return err?.data?.message || err?.message || fallback;
}
