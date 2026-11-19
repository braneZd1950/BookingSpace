/**
 * Tri razine vidljivosti za Otkrij (vlasnik odlučuje).
 *
 * - private: nije u Otkrij; pristup preko poveznice / članstva
 * - public: u Otkrij + online rezervacije na stranici poslovanja
 * - public_contact: u Otkrij radi pregleda; rezervaciju dogovara vlasnik
 *
 * Budući filtri grade se na ovom opt-in modelu — Otkrij nije obavezan SaaS sloj.
 */

export const DISCOVER_VISIBILITY = Object.freeze({
  PRIVATE: 'private',
  PUBLIC: 'public',
  PUBLIC_CONTACT: 'public_contact',
});

export const DISCOVER_VISIBILITY_VALUES = Object.freeze([
  DISCOVER_VISIBILITY.PRIVATE,
  DISCOVER_VISIBILITY.PUBLIC,
  DISCOVER_VISIBILITY.PUBLIC_CONTACT,
]);

/** Values that appear in public Otkrij listings. */
export const DISCOVER_LISTED = Object.freeze([
  DISCOVER_VISIBILITY.PUBLIC,
  DISCOVER_VISIBILITY.PUBLIC_CONTACT,
]);

export function isListedOnDiscover(visibility) {
  return (
    visibility === DISCOVER_VISIBILITY.PUBLIC
    || visibility === DISCOVER_VISIBILITY.PUBLIC_CONTACT
  );
}

export function allowsOnlineBookingFromDiscover(visibility) {
  return visibility === DISCOVER_VISIBILITY.PUBLIC;
}

/** Seed / lokalni test slugovi — nikad u javnom Otkrij. */
export const DISCOVER_EXCLUDED_SLUGS = Object.freeze([
  'demo-fitness',
  'demostudio',
  'demo-studio',
]);

export const DISCOVER_EXCLUDED_PATTERN = /^(demo|e2e|deep-studio|test|full-studio)/i;

const EXCLUDED_SLUGS = new Set(DISCOVER_EXCLUDED_SLUGS);

/** Seed / e2e / probe tenants must never appear in public Otkrij. */
export function isDiscoverExcludedTenant({ slug = '', name = '' } = {}) {
  const s = String(slug || '').trim().toLowerCase();
  const n = String(name || '').trim();
  if (!s && !n) return false;
  if (EXCLUDED_SLUGS.has(s)) return true;
  if (DISCOVER_EXCLUDED_PATTERN.test(s)) return true;
  if (/^(demo\s*studio|demo\s*fitness|deep\s*studio|e2e\b)/i.test(n)) return true;
  if (/demostudio/i.test(n.replace(/\s+/g, ''))) return true;
  return false;
}
