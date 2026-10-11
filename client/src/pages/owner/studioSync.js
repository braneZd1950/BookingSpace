import { findPalette, studioPalettes } from '../../styles/studioPalette.js';
import { loadStudio, saveStudio } from '../../studio.js';
import { fallbackHours } from './studioTime.js';

function dayRow(workingHours, day) {
  const row = (workingHours || []).find((item) => Number(item.day) === day);
  if (!row || row.closed || !row.open || !row.close) {
    return { works: false, from: '09:00', to: '13:00' };
  }
  return { works: true, from: row.open, to: row.close };
}

/** Map API workingHours into the studio UI hours shape. */
export function hoursFromWorking(workingHours) {
  if (!workingHours?.length) return null;
  return {
    ...fallbackHours,
    week: dayRow(workingHours, 1),
    saturday: dayRow(workingHours, 6),
    sunday: dayRow(workingHours, 0),
  };
}

export function paletteFromTenant(tenant) {
  const settings = tenant?.siteSettings || {};
  if (settings.paletteId) return findPalette(settings.paletteId);

  const theme = tenant?.theme || {};
  const matched = studioPalettes.find(
    (item) => item.theme.primaryColor === theme.primaryColor
      && item.theme.secondaryColor === theme.secondaryColor,
  );
  if (matched) return matched;

  const fallback = findPalette('teal');
  return {
    id: 'tenant',
    name: tenant?.name || 'Studio',
    theme: {
      ...fallback.theme,
      primaryColor: theme.primaryColor || fallback.theme.primaryColor,
      secondaryColor: theme.secondaryColor || fallback.theme.secondaryColor,
      fontFamily: theme.fontFamily || fallback.theme.fontFamily,
      borderRadius: theme.borderRadius || fallback.theme.borderRadius,
      buttonStyle: theme.buttonStyle || fallback.theme.buttonStyle,
    },
  };
}

export function sectionsFromTenant(tenant) {
  return {
    hero: true,
    about: true,
    services: true,
    schedule: true,
    gallery: false,
    contact: true,
    location: true,
    openingHours: true,
    ...(tenant?.siteSettings?.visibleSections || {}),
  };
}

/** Merge API tenant into local studio cache used by the owner shell. */
export function studioFromTenant(tenant, current = {}) {
  if (!tenant) return current;
  const hours = hoursFromWorking(tenant.bookingSettings?.workingHours);
  const palette = paletteFromTenant(tenant);
  const published = Boolean(
    tenant.theme?.primaryColor
    || tenant.siteSettings?.seo?.title
    || tenant.siteSettings?.paletteId,
  );

  return {
    ...current,
    id: String(tenant.id),
    name: tenant.name,
    slug: tenant.slug,
    niche: tenant.niche || current.niche,
    description: tenant.description || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    address: tenant.address || '',
    timezone: tenant.timezone || current.timezone || 'Europe/Zagreb',
    heroImageUrl: tenant.heroImageUrl || '',
    logoUrl: tenant.logoUrl || '',
    hours: hours || current.hours || fallbackHours,
    sections: sectionsFromTenant(tenant),
    layout: tenant.siteSettings?.layout || current.layout || 'banner',
    palette: palette.id === 'tenant' ? (current.palette || 'teal') : palette.id,
    template: tenant.siteSettings?.template || current.template,
    guideDone: current.guideDone || published,
  };
}

export function applyStudioFromTenant(tenant) {
  const next = studioFromTenant(tenant, loadStudio() || {});
  saveStudio(next);
  window.dispatchEvent(new Event('studio-changed'));
  return next;
}
