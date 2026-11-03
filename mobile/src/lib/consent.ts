/** Must match server CONSENT_VERSION. */
export const CONSENT_VERSION = '2026-10-13';

const STATE_KEY = 'anyminutes.privacyConsent';
const ANON_KEY = 'anyminutes.consentAnon';

export type ConsentState = {
  accepted: boolean;
  version: string;
  acceptedAt?: string | null;
  withdrawnAt?: string | null;
  source?: string | null;
};

export type PrivacyConsentDto = {
  accepted?: boolean;
  version?: string;
  acceptedAt?: string | null;
  withdrawnAt?: string | null;
  source?: string | null;
  isCurrent?: boolean;
};

function randomKey() {
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getAnonymousKey(
  getItem: (key: string) => Promise<string | null>,
  setItem: (key: string, value: string) => Promise<void>,
): Promise<string> {
  const existing = await getItem(ANON_KEY);
  if (existing) return existing;
  const key = randomKey();
  await setItem(ANON_KEY, key);
  return key;
}

export async function readLocalConsent(
  getItem: (key: string) => Promise<string | null>,
): Promise<ConsentState | null> {
  try {
    const raw = await getItem(STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function writeLocalConsent(
  setItem: (key: string, value: string) => Promise<void>,
  deleteItem: (key: string) => Promise<void>,
  state: ConsentState | null,
): Promise<void> {
  if (!state) {
    await deleteItem(STATE_KEY);
    return;
  }
  await setItem(STATE_KEY, JSON.stringify(state));
}

export async function hasValidLocalConsent(
  getItem: (key: string) => Promise<string | null>,
): Promise<boolean> {
  const state = await readLocalConsent(getItem);
  return Boolean(state?.accepted) && state?.version === CONSENT_VERSION;
}

export function consentFromUser(user: { privacyConsent?: PrivacyConsentDto } | null | undefined) {
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

export function hasValidConsent(user: { privacyConsent?: PrivacyConsentDto } | null | undefined) {
  if (user?.privacyConsent) {
    return Boolean(user.privacyConsent.isCurrent);
  }
  return false;
}
