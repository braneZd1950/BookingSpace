import { tokens } from './tokens';

export type SiteTheme = {
  primaryColor: string;
  secondaryColor: string;
  canvas: string;
  ink: string;
  onPrimary: string;
  borderRadius: number;
};

const teal: SiteTheme = {
  primaryColor: tokens.brand,
  secondaryColor: tokens.brandSoft,
  canvas: '#f4f9f9',
  ink: '#123238',
  onPrimary: '#ffffff',
  borderRadius: 8,
};

const byId: Record<string, SiteTheme> = {
  teal,
  navy: {
    primaryColor: '#243056',
    secondaryColor: '#d9e0ef',
    canvas: '#f6f7fb',
    ink: '#1c2233',
    onPrimary: '#ffffff',
    borderRadius: 8,
  },
  emerald: {
    primaryColor: '#006e54',
    secondaryColor: '#d6f2e8',
    canvas: '#f2faf7',
    ink: '#0f3228',
    onPrimary: '#ffffff',
    borderRadius: 8,
  },
};

export function themeFromTenant(tenant?: {
  siteSettings?: { paletteId?: string };
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    borderRadius?: string | number;
  };
} | null): SiteTheme {
  const paletteId = tenant?.siteSettings?.paletteId;
  const base = (paletteId && byId[paletteId]) || teal;
  const t = tenant?.theme || {};
  return {
    ...base,
    primaryColor: t.primaryColor || base.primaryColor,
    secondaryColor: t.secondaryColor || base.secondaryColor,
    onPrimary: '#ffffff',
    borderRadius: 8,
  };
}
