import {
  generateStudioCookies,
  generateStudioPrivacy,
  generateStudioTerms,
} from '../../../../shared/studioLegal.js';

export {
  generateAllStudioLegal,
  generateStudioCookies,
  generateStudioPrivacy,
  generateStudioTerms,
} from '../../../../shared/studioLegal.js';

export function legalBody(tenant, kind) {
  const legal = tenant?.siteSettings?.legal || {};
  const custom = legal[kind];
  if (typeof custom === 'string' && custom.trim()) return custom.trim();
  const studio = {
    name: tenant?.name || 'Studio',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    address: tenant?.address || '',
  };
  if (kind === 'privacy') return generateStudioPrivacy(studio);
  if (kind === 'terms') return generateStudioTerms(studio);
  return generateStudioCookies(studio);
}

export function paragraphsFromLegal(text) {
  return String(text || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
