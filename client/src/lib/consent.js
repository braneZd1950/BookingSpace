/** Mora odgovarati server CONSENT_VERSION. */
export const CONSENT_VERSION = '2026-10-13';

const STATE_KEY = 'bookingspace.privacyConsent';
const ANON_KEY = 'bookingspace.consentAnon';
export const CONSENT_EVENT = 'privacy-consent-changed';

function randomKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return `anon-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
  }
  throw new Error('Secure random generator unavailable');
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

function userIdOf(user) {
  if (!user) return '';
  return String(user.id || user._id || '');
}

/**
 * Consent resolution:
 * - Guest: localStorage only.
 * - Logged in + server isCurrent: accepted.
 * - Logged in + withdrawn / stale version on account: not accepted (re-prompt).
 * - Logged in + account never recorded: trust device only when bound to this user
 *   or still flagged for one-time guest→account sync (not after logout onto another account).
 *
 * Important: Mongo always embeds privacyConsent defaults, so "empty" must not
 * wipe a valid device accept for the same account (that caused the banner to
 * reappear after restart whenever /me loaded before/without a synced DB row).
 */
export function hasValidConsent(user) {
  const remote = consentFromUser(user);
  if (remote?.isCurrent) return true;
  if (!user) return hasValidLocalConsent();

  if (remote?.withdrawnAt && !remote.accepted) return false;
  if (remote?.accepted && !remote.isCurrent) return false;

  const neverRecorded = !remote?.accepted && !remote?.withdrawnAt;
  if (!neverRecorded || !hasValidLocalConsent()) return false;

  const local = readLocalConsent();
  if (local?.allowAccountSync === true) return true;
  const uid = userIdOf(user);
  return Boolean(uid && local?.userId && String(local.userId) === uid);
}

/**
 * @param {string} [source]
 * @param {{ allowAccountSync?: boolean, userId?: string|null }} [options]
 *   allowAccountSync: guest accept may be copied to the next login once.
 *   Cleared on logout so another account on this device is not auto-accepted.
 *   userId: binds accept to the logged-in account so restart keeps the banner away.
 */
export function acceptLocally(source = 'banner', { allowAccountSync = true, userId = null } = {}) {
  const prev = readLocalConsent();
  writeLocalConsent({
    accepted: true,
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
    withdrawnAt: null,
    source,
    allowAccountSync: Boolean(allowAccountSync),
    userId: userId != null && userId !== ''
      ? String(userId)
      : (prev?.userId || null),
  });
}

/** Keep device accept after logout, but do not push it onto the next account. */
export function retainLocalConsentAfterLogout() {
  const prev = readLocalConsent();
  if (!prev?.accepted || prev.version !== CONSENT_VERSION) return;
  writeLocalConsent({
    ...prev,
    allowAccountSync: false,
    // Keep userId so the same account still matches on re-login if DB sync lagged.
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
    allowAccountSync: false,
    userId: null,
  });
}
