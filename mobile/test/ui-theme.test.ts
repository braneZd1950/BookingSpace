import assert from 'node:assert/strict';
import { test } from 'node:test';

/** Keep in sync with `src/lib/uiTheme.ts` (avoid importing Expo storage in unit tests). */
const UI_THEMES = ['system', 'light', 'dark'] as const;
type UiTheme = (typeof UI_THEMES)[number];

function normalizeUiTheme(value: unknown): UiTheme {
  return UI_THEMES.includes(value as UiTheme) ? (value as UiTheme) : 'system';
}

function resolveColorScheme(
  uiTheme: UiTheme,
  system: 'light' | 'dark' | null | undefined = 'light',
): 'light' | 'dark' {
  if (uiTheme === 'light') return 'light';
  if (uiTheme === 'dark') return 'dark';
  return system === 'dark' ? 'dark' : 'light';
}

test('normalizeUiTheme accepts system/light/dark only', () => {
  assert.equal(normalizeUiTheme('light'), 'light');
  assert.equal(normalizeUiTheme('dark'), 'dark');
  assert.equal(normalizeUiTheme('system'), 'system');
  assert.equal(normalizeUiTheme('weird'), 'system');
});

test('resolveColorScheme respects forced and system themes', () => {
  assert.equal(resolveColorScheme('light', 'dark'), 'light');
  assert.equal(resolveColorScheme('dark', 'light'), 'dark');
  assert.equal(resolveColorScheme('system', 'dark'), 'dark');
  assert.equal(resolveColorScheme('system', 'light'), 'light');
});
