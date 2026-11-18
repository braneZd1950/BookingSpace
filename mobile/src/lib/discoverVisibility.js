/**
 * Tri razine vidljivosti za Otkrij (vlasnik odlučuje).
 * Usklađeno s client/src/lib/discoverVisibility.js i server Tenant modelom.
 *
 * - private: nije u Otkrij; pristup poveznicom / članstvom
 * - public: u Otkrij + online rezervacije
 * - public_contact: u Otkrij radi pregleda; rezervaciju dogovara vlasnik
 */

export const DISCOVER_VISIBILITY = Object.freeze({
  PRIVATE: 'private',
  PUBLIC: 'public',
  PUBLIC_CONTACT: 'public_contact',
});

export function isListedOnDiscover(visibility) {
  return (
    visibility === DISCOVER_VISIBILITY.PUBLIC
    || visibility === DISCOVER_VISIBILITY.PUBLIC_CONTACT
  );
}

export function allowsOnlineBookingFromDiscover(visibility) {
  return visibility === DISCOVER_VISIBILITY.PUBLIC;
}

const EXCLUDED_SLUGS = new Set(['demo-fitness', 'demostudio', 'demo-studio']);
const EXCLUDED_SLUG_PATTERN = /^(demo|e2e|deep-studio|test|full-studio)/i;

/** Seed / e2e / probe tenants must never appear in public Otkrij. */
export function isDiscoverExcludedTenant({ slug = '', name = '' } = {}) {
  const s = String(slug || '').trim().toLowerCase();
  const n = String(name || '').trim();
  if (!s && !n) return false;
  if (EXCLUDED_SLUGS.has(s)) return true;
  if (EXCLUDED_SLUG_PATTERN.test(s)) return true;
  if (/^(demo\s*studio|demo\s*fitness|deep\s*studio|e2e\b)/i.test(n)) return true;
  if (/demostudio/i.test(n.replace(/\s+/g, ''))) return true;
  return false;
}
