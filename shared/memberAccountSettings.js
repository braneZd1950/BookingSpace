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
  themeLocalOnly: 'Tema ostaje lokalno — nije spremljena na račun.',
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
