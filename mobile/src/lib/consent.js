/** Mora odgovarati server CONSENT_VERSION. */
export const CONSENT_VERSION = '2026-10-13';

export function hasValidConsent(user) {
  if (user?.privacyConsent) {
    return Boolean(user.privacyConsent.isCurrent);
  }
  return false;
}
