import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeUiTheme, UI_THEME_KEY, UI_THEMES } from '../src/lib/uiTheme.js';

test('normalizeUiTheme accepts system/light/dark only', () => {
  assert.equal(normalizeUiTheme('light'), 'light');
  assert.equal(normalizeUiTheme('dark'), 'dark');
  assert.equal(normalizeUiTheme('system'), 'system');
  assert.equal(normalizeUiTheme('nope'), 'system');
  assert.equal(UI_THEME_KEY, 'bookingspace.uiTheme');
  assert.deepEqual(UI_THEMES, ['system', 'light', 'dark']);
});
