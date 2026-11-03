import { apiRequest } from './client';

export type TenantTheme = {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  buttonStyle?: string;
};

export type TenantLegal = {
  privacy?: string;
  terms?: string;
  cookies?: string;
  updatedAt?: string;
};

export type TenantSiteSettings = {
  visibleSections?: Record<string, boolean>;
  layout?: string;
  paletteId?: string;
  gallery?: Array<string | { url?: string }>;
  seo?: { title?: string; description?: string };
  legal?: TenantLegal;
};

export type WorkingHour = {
  day: number;
  open?: string;
  close?: string;
  closed?: boolean;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  niche?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  oib?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  theme?: TenantTheme;
  siteSettings?: TenantSiteSettings;
  bookingSettings?: { workingHours?: WorkingHour[] };
  active?: boolean;
};

export type MyTenantRow = {
  role: string;
  tenant: Tenant;
};

export async function listMyTenants(): Promise<MyTenantRow[]> {
  const data = await apiRequest<{ tenants: MyTenantRow[] }>('/tenants/mine');
  return data.tenants || [];
}

export type PublicTrainer = {
  id: string;
  name: string;
  title?: string;
};

export type PublicService = {
  id: string;
  name: string;
  durationMinutes: number;
  capacity: number;
  cancellationWindowMinutes?: number;
  active?: boolean;
};

export type PublicTenant = Tenant & {
  timezone?: string;
  services?: PublicService[];
  trainers?: PublicTrainer[];
};

export async function getPublicTenant(slug: string): Promise<PublicTenant> {
  const data = await apiRequest<{ tenant: PublicTenant }>(
    `/tenants/${encodeURIComponent(slug)}/public`,
    { auth: false },
  );
  return data.tenant;
}

export type DiscoverPlace = {
  id?: string;
  name: string;
  slug: string;
  niche?: string;
  city?: string;
  description?: string;
};

export async function discoverTenants(opts: {
  q?: string;
  category?: string;
  limit?: number;
} = {}): Promise<DiscoverPlace[]> {
  const params = new URLSearchParams();
  if (opts.q) params.set('q', opts.q);
  if (opts.category && opts.category !== 'all') params.set('category', opts.category);
  params.set('limit', String(opts.limit ?? 60));
  const qs = params.toString();
  const data = await apiRequest<{ places?: DiscoverPlace[] }>(
    `/tenants/discover${qs ? `?${qs}` : ''}`,
    { auth: false },
  );
  return data.places || [];
}

export async function updateTenant(
  id: string,
  body: Record<string, unknown>,
): Promise<Tenant> {
  const data = await apiRequest<{ tenant: Tenant }>(`/tenants/${id}`, {
    method: 'PATCH',
    body,
  });
  return data.tenant;
}

export async function updateSite(
  id: string,
  body: Record<string, unknown>,
): Promise<Tenant> {
  const data = await apiRequest<{ tenant: Tenant }>(`/tenants/${id}/site`, {
    method: 'PATCH',
    body,
  });
  return data.tenant;
}
