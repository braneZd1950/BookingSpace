import type { UiTheme } from '../lib/uiTheme';
import { tokens } from './tokens';

export const darkTokens = {
  bg: '#0d1a1c',
  surface: '#142528',
  line: '#24393c',
  fg: '#e6f0f0',
  muted: '#92a8ab',
  brand: '#3fb6bf',
  onBrand: '#06282b',
  brandStrong: '#7fd3d9',
  brandSoft: '#123a3e',
  accent: '#f2b04f',
  onAccent: '#2b1b00',
  ok: '#4cc38a',
  okSoft: '#12301f',
  okInk: '#6fd6a4',
  low: '#e0a94a',
  lowSoft: '#33270f',
  lowInk: '#ebbb62',
  full: '#ee7b7b',
  fullSoft: '#3a1818',
  fullInk: '#f29a9a',
  member: '#8e9deb',
  memberSoft: '#1e2447',
  memberInk: '#a9b6f2',
  loginMist: '#102c2f',
  loginInk: '#e6f0f0',
  loginPanel: 'rgba(20, 37, 40, 0.92)',
  board: '#142528',
} as const;

export type AppPalette = typeof tokens;

export function resolveColorScheme(
  uiTheme: UiTheme,
  system: 'light' | 'dark' | null | undefined = 'light',
): 'light' | 'dark' {
  if (uiTheme === 'light') return 'light';
  if (uiTheme === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

export function paletteForScheme(scheme: 'light' | 'dark'): AppPalette {
  return scheme === 'dark' ? (darkTokens as unknown as AppPalette) : tokens;
}
