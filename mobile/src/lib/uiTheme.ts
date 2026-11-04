import { getItem, setItem } from './storage';

export type UiTheme = 'system' | 'light' | 'dark';

export const UI_THEME_KEY = 'anyminutes.uiTheme';
export const UI_THEMES: UiTheme[] = ['system', 'light', 'dark'];

export function normalizeUiTheme(value: unknown): UiTheme {
  return UI_THEMES.includes(value as UiTheme) ? (value as UiTheme) : 'system';
}

export async function readStoredUiTheme(): Promise<UiTheme> {
  try {
    return normalizeUiTheme(await getItem(UI_THEME_KEY));
  } catch {
    return 'system';
  }
}

export async function storeUiTheme(theme: UiTheme): Promise<UiTheme> {
  const next = normalizeUiTheme(theme);
  await setItem(UI_THEME_KEY, next);
  return next;
}
