import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('web App exposes auth + reset password routes used by API emails', () => {
  const app = readFileSync(join(root, 'src/app/App.jsx'), 'utf8');

  for (const route of [
    '/login',
    '/register',
    '/zaboravljena-lozinka',
    '/nova-lozinka',
    '/s/:slug',
    '/stranica',
  ]) {
    assert.match(app, new RegExp(`path="${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  }

  assert.match(app, /ForgotPasswordPage/);
  assert.match(app, /ResetPasswordPage/);
  assert.match(app, /RegisterPage/);
  assert.match(app, /LoginPage/);
});

test('forgot/reset pages wire API endpoints and token query param', () => {
  const forgot = readFileSync(join(root, 'src/pages/public/ForgotPasswordPage.jsx'), 'utf8');
  const reset = readFileSync(join(root, 'src/pages/public/ResetPasswordPage.jsx'), 'utf8');
  const api = readFileSync(join(root, 'src/api/authApi.js'), 'utf8');

  assert.match(forgot, /forgotPassword/);
  assert.match(reset, /resetPassword/);
  assert.match(reset, /params\.get\('token'\)/);
  assert.match(api, /url:\s*'\/auth\/forgot-password'/);
  assert.match(api, /url:\s*'\/auth\/reset-password'/);
  assert.match(api, /url:\s*'\/auth\/register'/);
  assert.match(api, /url:\s*'\/auth\/login'/);
});
