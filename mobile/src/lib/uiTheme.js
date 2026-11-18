import { Platform } from 'react-native';
import { BRAND, DARK_SURFACE, LIGHT_SURFACE } from './brandColors.js';

export const UI_THEME_KEY = 'bookingspace.uiTheme';
export const UI_THEMES = ['system', 'light', 'dark'];

export function normalizeUiTheme(value) {
  return UI_THEMES.includes(value) ? value : 'system';
}

export function readStoredUiTheme() {
  try {
    if (typeof localStorage === 'undefined') return 'system';
    return normalizeUiTheme(localStorage.getItem(UI_THEME_KEY));
  } catch {
    return 'system';
  }
}

export function storeUiTheme(theme) {
  const next = normalizeUiTheme(theme);
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(UI_THEME_KEY, next);
    }
  } catch {
    /* ignore */
  }
  return next;
}

function systemPrefersDark() {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Resolve stored preference to concrete dark/light. */
export function resolveUiTheme(theme) {
  const next = normalizeUiTheme(theme);
  if (next === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return next;
}

/** Apply on web document for parity with client ThemeSync. */
export function applyUiTheme(theme) {
  const next = normalizeUiTheme(theme);
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    if (next === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', next);
  }
  return next;
}

export function syncUiTheme(theme) {
  const next = storeUiTheme(theme);
  return applyUiTheme(next);
}

export const THEME_COLORS = {
  dark: {
    bg: DARK_SURFACE.bg,
    gradient: DARK_SURFACE.gradient,
    text: 'rgba(248, 250, 252, 0.92)',
    title: BRAND.onDark,
    muted: 'rgba(148, 163, 184, 0.95)',
    soft: 'rgba(226, 232, 240, 0.88)',
    accent: DARK_SURFACE.accent,
    border: 'rgba(148, 163, 184, 0.28)',
    card: 'rgba(30, 41, 59, 0.88)',
    cardBorder: 'rgba(20, 184, 166, 0.4)',
    ctaBg: DARK_SURFACE.cta,
    ctaText: '#FFFFFF',
    danger: '#FCA5A5',
    status: 'light',
  },
  light: {
    bg: LIGHT_SURFACE.bg,
    gradient: LIGHT_SURFACE.gradient,
    text: 'rgba(15, 23, 42, 0.88)',
    title: BRAND.navy,
    muted: 'rgba(100, 116, 139, 0.95)',
    soft: 'rgba(51, 65, 85, 0.88)',
    accent: LIGHT_SURFACE.accent,
    border: 'rgba(37, 99, 235, 0.18)',
    card: 'rgba(255, 255, 255, 0.94)',
    cardBorder: 'rgba(37, 99, 235, 0.28)',
    ctaBg: LIGHT_SURFACE.cta,
    ctaText: '#FFFFFF',
    danger: '#B91C1C',
    status: 'dark',
  },
};

export function colorsForTheme(theme) {
  const resolved = resolveUiTheme(theme);
  return THEME_COLORS[resolved] || THEME_COLORS.dark;
}
