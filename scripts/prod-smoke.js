/**
 * Live local smoke against running API (+ optional preview UI).
 *
 * Usage:
 *   node scripts/prod-smoke.js
 *
 * Requires API on :4000. For admin checks:
 *   $env:SMOKE_ADMIN_EMAIL="admin@gmail.com"
 *   $env:SMOKE_ADMIN_PASS="..."
 *   node scripts/prod-smoke.js
 *
 * Preview UI (production build against local API):
 *   cd client
 *   $env:VITE_API_URL="http://localhost:4000/api"
 *   npm run build
 *   npx vite preview --host 127.0.0.1 --port 4173
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const apiBase = process.env.SMOKE_API || 'http://localhost:4000/api';
const webBase = process.env.SMOKE_WEB || 'http://localhost:4173';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, 'server', '.env'));
loadEnvFile(path.join(root, '.env'));

const results = [];
let failed = 0;

function ok(name, pass, detail = '') {
  results.push({ name, pass, detail });
  if (!pass) failed += 1;
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function req(pathName, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBase}${pathName}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { status: response.status, body: payload };
}

async function web(pathName) {
  const response = await fetch(`${webBase}${pathName}`, { redirect: 'manual' });
  return response.status;
}

async function main() {
  console.log(`\nProd smoke\n  API ${apiBase}\n  WEB ${webBase}\n`);

  const health = await req('/health');
  ok('API health', health.status === 200 && health.body?.ok === true, String(health.status));

  const stamp = Date.now();
  const password = 'Smoke-Pass-123!';
  const ownerEmail = `smoke-owner-${stamp}@example.com`;
  const memberEmail = `smoke-member-${stamp}@example.com`;

  const owner = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Smoke Owner',
      email: ownerEmail,
      password,
      role: 'BUSINESS_OWNER',
    },
  });
  ok('Register owner', owner.status === 201 && owner.body?.token, String(owner.status));
  const ownerToken = owner.body?.token;

  const tenant = await req('/tenants', {
    method: 'POST',
    token: ownerToken,
    body: {
      name: `Smoke Studio ${stamp}`,
      niche: 'fitness',
      email: ownerEmail,
    },
  });
  ok('Create tenant', tenant.status === 201 && tenant.body?.tenant?.id, String(tenant.status));
  const tenantId = tenant.body?.tenant?.id;
  const slug = tenant.body?.tenant?.slug;

  const pub = await req(`/tenants/${slug}/public`);
  ok('Public tenant page API', pub.status === 200 && pub.body?.tenant?.slug === slug, String(pub.status));

  const service = await req(`/tenants/${tenantId}/services`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: 'Smoke Session',
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      capacity: 4,
      cancellationWindowMinutes: 60,
      price: 15,
      membershipRequired: false,
    },
  });
  ok('Create service', service.status === 201, String(service.status));

  const member = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Smoke Member',
      email: memberEmail,
      password,
      role: 'CUSTOMER',
    },
  });
  ok('Register member', member.status === 201, String(member.status));

  const login = await req('/auth/login', {
    method: 'POST',
    body: { email: ownerEmail, password },
  });
  ok('Owner login', login.status === 200 && login.body?.token, String(login.status));

  const forgot = await req('/auth/forgot-password', {
    method: 'POST',
    body: { email: ownerEmail },
  });
  ok(
    'Forgot password endpoint',
    forgot.status === 200 || forgot.status === 202,
    String(forgot.status),
  );

  const blocked = await req('/analytics/platform/billing', { token: ownerToken });
  ok('Non-admin blocked from billing', blocked.status === 403, String(blocked.status));

  const adminEmail = process.env.SMOKE_ADMIN_EMAIL || process.env.ADMIN_EMAILS?.split(',')[0]?.trim();
  const adminPass = process.env.SMOKE_ADMIN_PASS;
  if (adminEmail && adminPass) {
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPass },
    });
    ok('Admin login', adminLogin.status === 200 && adminLogin.body?.token, String(adminLogin.status));
    const adminToken = adminLogin.body?.token;

    const me = await req('/auth/me', { token: adminToken });
    ok('Admin platformAdmin flag', me.body?.platformAdmin === true, String(me.body?.platformAdmin));

    for (const [label, pathName] of [
      ['platform overview', '/analytics/platform?days=30'],
      ['platform studios', '/analytics/platform/studios?days=30'],
      ['platform users', '/analytics/platform/users?days=30'],
      ['platform activity', '/analytics/platform/activity?days=7'],
      ['platform reports', '/analytics/platform/reports?days=30'],
      ['platform system', '/analytics/platform/system'],
      ['platform billing', '/analytics/platform/billing'],
    ]) {
      const res = await req(pathName, { token: adminToken });
      ok(`Admin ${label}`, res.status === 200, String(res.status));
    }

    if (tenantId) {
      const mark = await req(`/analytics/platform/billing/${tenantId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { amount: 49, plan: 'standard', markPaid: true },
      });
      ok('Admin mark paid', mark.status === 200 && mark.body?.studio?.status === 'PAID', String(mark.status));
    }
  } else {
    console.log('SKIP  Admin platform checks — set SMOKE_ADMIN_EMAIL + SMOKE_ADMIN_PASS');
  }

  try {
    const home = await web('/');
    ok('Preview home', home === 200, String(home));
    for (const route of ['/login', '/register', '/analitika']) {
      const status = await web(route);
      ok(`Preview ${route}`, status === 200, String(status));
    }
  } catch (error) {
    ok('Preview web reachable', false, error.message);
  }

  console.log(`\n${failed === 0 ? 'ALL CHECKS PASSED' : `${failed} CHECK(S) FAILED`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
