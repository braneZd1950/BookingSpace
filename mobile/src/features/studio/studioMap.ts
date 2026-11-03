import type { Tenant, WorkingHour } from '../../api/tenants';
import { env } from '../../config/env';
import { themeFromTenant, type SiteTheme } from '../../theme/palettes';

export type DayHours = { works: boolean; from: string; to: string };

export type StudioHours = {
  week: DayHours;
  saturday: DayHours;
  sunday: DayHours;
  holidays: DayHours;
};

export type StudioSections = {
  hero: boolean;
  about: boolean;
  services: boolean;
  schedule: boolean;
  gallery: boolean;
  contact: boolean;
  location: boolean;
  openingHours: boolean;
};

export type StudioView = {
  id: string;
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  oib: string;
  heroImageUrl: string;
  logoUrl: string;
  hours: StudioHours;
  sections: StudioSections;
  gallery: string[];
  theme: SiteTheme;
  guideDone: boolean;
  legal: {
    privacy: string;
    terms: string;
    cookies: string;
    updatedAt: string;
  };
};

export const HOUR_ROWS: Array<[keyof StudioHours, string]> = [
  ['week', 'Ponedjeljak–petak'],
  ['saturday', 'Subota'],
  ['sunday', 'Nedjelja'],
  ['holidays', 'Blagdani'],
];

const fallbackHours: StudioHours = {
  week: { works: true, from: '07:00', to: '21:00' },
  saturday: { works: true, from: '09:00', to: '13:00' },
  sunday: { works: false, from: '09:00', to: '13:00' },
  holidays: { works: false, from: '09:00', to: '13:00' },
};

const ambient = {
  hero: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=80',
  about: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
};

export function mediaUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  const origin = env.apiUrl.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`;
}

function dayRow(workingHours: WorkingHour[] | undefined, day: number): DayHours {
  const row = (workingHours || []).find((item) => Number(item.day) === day);
  if (!row || row.closed || !row.open || !row.close) {
    return { works: false, from: '09:00', to: '13:00' };
  }
  return { works: true, from: row.open, to: row.close };
}

export function hoursFromWorking(workingHours?: WorkingHour[]): StudioHours {
  if (!workingHours?.length) return fallbackHours;
  return {
    ...fallbackHours,
    week: dayRow(workingHours, 1),
    saturday: dayRow(workingHours, 6),
    sunday: dayRow(workingHours, 0),
  };
}

export function hoursLine(label: string, row?: DayHours): string {
  if (!row) return `${label}: zatvoreno`;
  return row.works ? `${label}: ${row.from}–${row.to}` : `${label}: zatvoreno`;
}

export function studioFromTenant(tenant: Tenant): StudioView {
  const published = Boolean(
    tenant.theme?.primaryColor
    || tenant.siteSettings?.seo?.title
    || tenant.siteSettings?.paletteId,
  );
  const sections: StudioSections = {
    hero: true,
    about: true,
    services: true,
    schedule: true,
    gallery: false,
    contact: true,
    location: true,
    openingHours: true,
    ...(tenant.siteSettings?.visibleSections || {}),
  };
  const gallery = (tenant.siteSettings?.gallery || [])
    .map((item) => mediaUrl(typeof item === 'string' ? item : item?.url))
    .filter(Boolean);

  return {
    id: String(tenant.id),
    name: tenant.name,
    slug: tenant.slug,
    description: tenant.description || '',
    phone: tenant.phone || '',
    email: tenant.email || '',
    address: tenant.address || '',
    city: tenant.city || '',
    oib: tenant.oib || '',
    heroImageUrl: mediaUrl(tenant.heroImageUrl),
    logoUrl: mediaUrl(tenant.logoUrl),
    hours: hoursFromWorking(tenant.bookingSettings?.workingHours),
    sections,
    gallery,
    theme: themeFromTenant(tenant),
    guideDone: published,
    legal: {
      privacy: tenant.siteSettings?.legal?.privacy || '',
      terms: tenant.siteSettings?.legal?.terms || '',
      cookies: tenant.siteSettings?.legal?.cookies || '',
      updatedAt: tenant.siteSettings?.legal?.updatedAt || '',
    },
  };
}

export function heroPhoto(studio: StudioView): string {
  return studio.heroImageUrl || ambient.hero;
}

export function aboutPhoto(studio: StudioView): string {
  return studio.heroImageUrl || ambient.about;
}
