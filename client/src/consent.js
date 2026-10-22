/** Mora odgovarati server CONSENT_VERSION. */
export const CONSENT_VERSION = '2026-10-13';

const STATE_KEY = 'bookingspace.privacyConsent';
const ANON_KEY = 'bookingspace.consentAnon';
export const CONSENT_EVENT = 'privacy-consent-changed';

function randomKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnonymousKey() {
  try {
    let key = localStorage.getItem(ANON_KEY);
    if (!key) {
      key = randomKey();
      localStorage.setItem(ANON_KEY, key);
    }
    return key;
  } catch {
    return randomKey();
  }
}

export function readLocalConsent() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeLocalConsent(state) {
  try {
    if (!state) localStorage.removeItem(STATE_KEY);
    else localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function hasValidLocalConsent() {
  const state = readLocalConsent();
  return Boolean(state?.accepted) && state?.version === CONSENT_VERSION;
}

export function consentFromUser(user) {
  const raw = user?.privacyConsent;
  if (!raw) return null;
  return {
    accepted: Boolean(raw.accepted),
    version: raw.version || '',
    acceptedAt: raw.acceptedAt || null,
    withdrawnAt: raw.withdrawnAt || null,
    source: raw.source || null,
    isCurrent: Boolean(raw.isCurrent ?? (raw.accepted && raw.version === CONSENT_VERSION)),
  };
}

/** Logged-in user wins; otherwise localStorage. */
export function hasValidConsent(user) {
  if (user?.privacyConsent) {
    return Boolean(user.privacyConsent.isCurrent);
  }
  return hasValidLocalConsent();
}

export function acceptLocally(source = 'banner') {
  writeLocalConsent({
    accepted: true,
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    withdrawnAt: null,
    source,
  });
}

export function withdrawLocally(source = 'settings') {
  const prev = readLocalConsent();
  writeLocalConsent({
    accepted: false,
    version: prev?.version || CONSENT_VERSION,
    acceptedAt: prev?.acceptedAt || null,
    withdrawnAt: new Date().toISOString(),
    source,
  });
}
