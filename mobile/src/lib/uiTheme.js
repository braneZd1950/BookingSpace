import { Platform } from 'react-native';

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
    bg: '#0E1614',
    gradient: ['#163028', '#111A18', '#0E1614'],
    text: '#E8F2EF',
    title: '#F7FCFA',
    muted: 'rgba(232, 242, 239, 0.68)',
    soft: 'rgba(232, 242, 239, 0.82)',
    accent: '#5EEAD4',
    border: 'rgba(232, 242, 239, 0.2)',
    card: 'rgba(18, 34, 30, 0.78)',
    cardBorder: 'rgba(94, 234, 212, 0.35)',
    ctaBg: '#5EEAD4',
    ctaText: '#061210',
    danger: '#FCA5A5',
    status: 'light',
  },
  light: {
    bg: '#F3F7F5',
    gradient: ['#EEF6F3', '#F7FBFA', '#F3F7F5'],
    text: '#1A2A26',
    title: '#0C1815',
    muted: 'rgba(12, 24, 21, 0.62)',
    soft: 'rgba(12, 24, 21, 0.78)',
    accent: '#0F766E',
    border: 'rgba(12, 24, 21, 0.14)',
    card: 'rgba(255, 255, 255, 0.92)',
    cardBorder: 'rgba(15, 118, 110, 0.28)',
    ctaBg: '#0F766E',
    ctaText: '#F7FCFA',
    danger: '#B91C1C',
    status: 'dark',
  },
};

export function colorsForTheme(theme) {
  const resolved = resolveUiTheme(theme);
  return THEME_COLORS[resolved] || THEME_COLORS.dark;
}
