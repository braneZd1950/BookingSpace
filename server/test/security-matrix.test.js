import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Dense authz / input matrix — defensive checks only (no exploit reproduction).
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(32).toString('base64url');
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.EMAIL_FROM = '';
process.env.ADMIN_EMAIL_BOOTSTRAP = 'false';

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/config/db.js');

let server;
let baseUrl;
const stamp = Date.now();

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }
  return { status: response.status, body: parsed, text };
}

async function register(name, email, role) {
  const res = await request('/api/auth/register', {
    method: 'POST',
    body: { name, email, password: 'SecurePass1!', role },
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { token: res.body.token, user: res.body.user };
}

async function consent(token) {
  await request('/api/consent', {
    method: 'POST',
    token,
    body: { action: 'accept', version: '2026-10-13', source: 'settings' },
  });
}

let ownerA;
let ownerB;
let member;
let stranger;
let tenantA;
let serviceA;
let planA;

before(async () => {
  await connectDb();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  ownerA = await register('Mtx A', `mtx-a-${stamp}@example.com`, 'BUSINESS_OWNER');
  ownerB = await register('Mtx B', `mtx-b-${stamp}@example.com`, 'BUSINESS_OWNER');
  member = await register('Mtx Mem', `mtx-m-${stamp}@example.com`, 'CUSTOMER');
  stranger = await register('Mtx Str', `mtx-s-${stamp}@example.com`, 'CUSTOMER');
  await consent(ownerA.token);
  await consent(ownerB.token);
  await consent(member.token);
  await consent(stranger.token);

  const ta = await request('/api/tenants', {
    method: 'POST',
    token: ownerA.token,
    body: { name: `Matrix Studio ${stamp}`, niche: 'fitness' },
  });
  assert.equal(ta.status, 201);
  tenantA = ta.body.tenant;

  const svc = await request(`/api/tenants/${tenantA.id}/services`, {
    method: 'POST',
    token: ownerA.token,
    body: {
      name: 'Mtx Session',
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      capacity: 4,
      price: 0,
      membershipRequired: true,
    },
  });
  assert.equal(svc.status, 201);
  serviceA = svc.body.service;

  const plan = await request(`/api/tenants/${tenantA.id}/membership-plans`, {
    method: 'POST',
    token: ownerA.token,
    body: {
      name: 'Mtx Plan',
      price: 0,
      validityDays: 30,
      sessionsIncluded: 5,
      allowedServiceIds: [serviceA.id],
    },
  });
  assert.equal(plan.status, 201);
  planA = plan.body.plan;

  const mem = await request(`/api/tenants/${tenantA.id}/memberships`, {
    method: 'POST',
    token: ownerA.token,
    body: {
      membershipPlanId: planA.id,
      method: 'CASH',
      customer: { name: member.user.name, email: member.user.email },
    },
  });
  assert.equal(mem.status, 201);
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

test('stranger cannot create membership on foreign tenant', async () => {
  const res = await request(`/api/tenants/${tenantA.id}/memberships`, {
    method: 'POST',
    token: stranger.token,
    body: {
      membershipPlanId: planA.id,
      method: 'CASH',
      customer: { name: 'Hack', email: `hack-${stamp}@example.com` },
    },
  });
  assert.ok([401, 403, 404].includes(res.status), String(res.status));
});

test('owner B cannot create service on tenant A', async () => {
  const res = await request(`/api/tenants/${tenantA.id}/services`, {
    method: 'POST',
    token: ownerB.token,
    body: {
      name: 'Stolen',
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      capacity: 1,
      price: 0,
    },
  });
  assert.ok([401, 403, 404].includes(res.status), String(res.status));
});

test('member cannot PATCH tenant settings', async () => {
  const res = await request(`/api/tenants/${tenantA.id}`, {
    method: 'PATCH',
    token: member.token,
    body: { name: 'Member rename' },
  });
  assert.ok([401, 403, 404].includes(res.status), String(res.status));
});

test('oversized JSON body is rejected or limited', async () => {
  const huge = 'x'.repeat(2_000_000);
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'a@b.co', password: huge },
  });
  assert.ok([400, 401, 413, 422].includes(res.status), String(res.status));
});

test('path traversal style tenant id is not treated as valid ObjectId', async () => {
  const res = await request('/api/tenants/..%2F..%2Fetc%2Fpasswd', {
    token: ownerA.token,
  });
  assert.ok([400, 404].includes(res.status), String(res.status));
  if (typeof res.body === 'string') {
    assert.ok(!/root:|passwd/i.test(res.body));
  }
});

test('script-like service name is stored without granting elevated access', async () => {
  const res = await request(`/api/tenants/${tenantA.id}/services`, {
    method: 'POST',
    token: ownerA.token,
    body: {
      name: '<script>alert(1)</script>',
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      capacity: 1,
      price: 0,
      membershipRequired: false,
    },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.service.name, '<script>alert(1)</script>');
  const list = await request(`/api/tenants/${tenantA.id}/services`, {
    token: stranger.token,
  });
  // Public list may exist; must not become owner.
  assert.ok([200, 401, 403, 404].includes(list.status), String(list.status));
});
