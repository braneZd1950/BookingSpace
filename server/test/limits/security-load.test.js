/**
 * Boundary + load harness (not part of default `npm test`).
 * Run: npm run test:limits
 *
 * Covers: authz/IDOR, JWT abuse, rate limits, payload ceilings,
 * privacy leaks, concurrent API pressure, SPA page latency.
 */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { addDays, zonedNow } from '../../src/utils/time.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(32).toString('base64url');
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.EMAIL_FROM = '';
process.env.ADMIN_EMAILS = '';
process.env.ADMIN_EMAIL_BOOTSTRAP = 'false';

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../../src/app.js');
const { connectDb, disconnectDb } = await import('../../src/config/db.js');
const { default: User } = await import('../../src/models/User.js');

const stamp = Date.now();
const password = 'Limits-Pass-123!';

let server;
let baseUrl;
const ids = { users: [] };

async function request(path, {
  method = 'GET',
  token,
  body,
  headers: extra = {},
  rawBody,
} = {}) {
  const headers = { ...extra };
  if (body !== undefined && rawBody === undefined) {
    headers['content-type'] = headers['content-type'] || 'application/json';
  }
  if (token) headers.authorization = `Bearer ${token}`;

  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: rawBody !== undefined
      ? rawBody
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  });
  const ms = performance.now() - started;
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  return { status: response.status, body: payload, ms, headers: response.headers, text };
}

async function register(name, email, role = 'CUSTOMER') {
  const res = await request('/api/auth/register', {
    method: 'POST',
    body: { name, email, password, role },
  });
  assert.equal(res.status, 201, `register ${email}: ${JSON.stringify(res.body)}`);
  ids.users.push(res.body.user.id);
  return res.body;
}

async function acceptConsent(token) {
  const res = await request('/api/consent', {
    method: 'POST',
    token,
    body: { action: 'accept', version: '2026-10-13', source: 'settings' },
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

before(async () => {
  await connectDb();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (ids.users.length) await User.deleteMany({ _id: { $in: ids.users } });
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

describe('security boundaries', () => {
  let ownerA;
  let ownerB;
  let member;
  let stranger;
  let tenantA;
  let tenantB;
  let serviceA;
  let bookingId;

  before(async () => {
    ownerA = await register('Owner A', `lim-owner-a-${stamp}@example.com`, 'BUSINESS_OWNER');
    ownerB = await register('Owner B', `lim-owner-b-${stamp}@example.com`, 'BUSINESS_OWNER');
    member = await register('Member', `lim-member-${stamp}@example.com`, 'CUSTOMER');
    stranger = await register('Stranger', `lim-stranger-${stamp}@example.com`, 'CUSTOMER');
    await acceptConsent(ownerA.token);
    await acceptConsent(ownerB.token);
    await acceptConsent(member.token);
    await acceptConsent(stranger.token);

    const ta = await request('/api/tenants', {
      method: 'POST',
      token: ownerA.token,
      body: { name: `Limits Studio A ${stamp}`, niche: 'fitness', oib: '11111111111' },
    });
    assert.equal(ta.status, 201, JSON.stringify(ta.body));
    tenantA = ta.body.tenant;

    await request(`/api/tenants/${tenantA.id}`, {
      method: 'PATCH',
      token: ownerA.token,
      body: {
        oib: '11111111111',
        bookingSettings: {
          capacityModel: 'PER_SLOT',
          workingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            day,
            closed: false,
            open: '07:00',
            close: '21:00',
          })),
        },
      },
    });

    const tb = await request('/api/tenants', {
      method: 'POST',
      token: ownerB.token,
      body: { name: `Limits Studio B ${stamp}`, niche: 'yoga', oib: '22222222222' },
    });
    assert.equal(tb.status, 201, JSON.stringify(tb.body));
    tenantB = tb.body.tenant;

    const svc = await request(`/api/tenants/${tenantA.id}/services`, {
      method: 'POST',
      token: ownerA.token,
      body: {
        name: 'Limits Session',
        durationMinutes: 30,
        slotIntervalMinutes: 30,
        capacity: 8,
        cancellationWindowMinutes: 60,
        price: 0,
        membershipRequired: true,
      },
    });
    assert.equal(svc.status, 201, JSON.stringify(svc.body));
    serviceA = svc.body.service;

    const plan = await request(`/api/tenants/${tenantA.id}/membership-plans`, {
      method: 'POST',
      token: ownerA.token,
      body: {
        name: 'Limits Plan',
        price: 0,
        validityDays: 30,
        sessionsIncluded: 20,
        allowedServiceIds: [serviceA.id],
      },
    });
    assert.equal(plan.status, 201, JSON.stringify(plan.body));

    const membership = await request(`/api/tenants/${tenantA.id}/memberships`, {
      method: 'POST',
      token: ownerA.token,
      body: {
        userId: member.user.id,
        membershipPlanId: plan.body.plan.id,
        method: 'CASH',
        amount: 0,
      },
    });
    assert.equal(membership.status, 201, JSON.stringify(membership.body));

    const trainer = await request(`/api/tenants/${tenantA.id}/staff`, {
      method: 'POST',
      token: ownerA.token,
      body: {
        name: 'Limits Trainer',
        email: `lim-trainer-${stamp}@example.com`,
        title: 'Trener',
      },
    });
    assert.equal(trainer.status, 201, JSON.stringify(trainer.body));
    ids.users.push(trainer.body.staff.id);
    const staffId = trainer.body.staff.id;

    const visitDate = addDays(zonedNow('Europe/Zagreb').date, 1);
    const availability = await request(
      `/api/tenants/${tenantA.id}/services/${serviceA.id}/availability?date=${visitDate}`,
      { token: member.token },
    );
    assert.equal(availability.status, 200);
    const slot = (availability.body.slots || []).find((item) => item.status === 'AVAILABLE');
    assert.ok(slot);

    const booked = await request('/api/bookings', {
      method: 'POST',
      token: member.token,
      body: {
        serviceId: serviceA.id,
        date: visitDate,
        startTime: slot.startTime,
        userId: member.user.id,
        staffId,
      },
    });
    assert.equal(booked.status, 201, JSON.stringify(booked.body));
    bookingId = booked.body.booking.id;
  });

  test('unauthenticated protected routes stay closed', async () => {
    const checks = [
      { path: '/api/auth/me', method: 'GET' },
      { path: '/api/tenants/mine', method: 'GET' },
      { path: '/api/bookings/my', method: 'GET' },
      { path: '/api/memberships/my', method: 'GET' },
      { path: `/api/tenants/${tenantA.id}`, method: 'PATCH', body: { name: 'Nope' } },
      { path: '/api/analytics/platform', method: 'GET' },
    ];
    for (const item of checks) {
      const res = await request(item.path, {
        method: item.method,
        body: item.body,
      });
      assert.notEqual(res.status, 200, item.path);
      assert.ok(
        res.status === 401 || res.status === 400 || res.status === 403 || res.status === 404,
        `${item.path} → ${res.status}`,
      );
    }
  });

  test('forged JWT is rejected', async () => {
    const forged = jwt.sign({ sub: member.user.id, v: 0 }, 'wrong-secret', { expiresIn: '1h' });
    const res = await request('/api/auth/me', { token: forged });
    assert.equal(res.status, 401);
  });

  test('tampered tokenVersion is rejected', async () => {
    const bad = jwt.sign(
      { sub: member.user.id, v: 999999 },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );
    const res = await request('/api/auth/me', { token: bad });
    assert.equal(res.status, 401);
  });

  test('logout revokes token', async () => {
    const temp = await register('Temp Logout', `lim-logout-${stamp}@example.com`);
    const out = await request('/api/auth/logout', { method: 'POST', token: temp.token });
    assert.equal(out.status, 204);
    const me = await request('/api/auth/me', { token: temp.token });
    assert.equal(me.status, 401);
  });

  test('member cannot read OIB via tenants/mine', async () => {
    const mine = await request('/api/tenants/mine', { token: member.token });
    assert.equal(mine.status, 200);
    const row = (mine.body.tenants || []).find((item) => item.tenant?.id === tenantA.id);
    assert.ok(row);
    assert.equal(row.tenant.oib, undefined);
  });

  test('cross-tenant owner PATCH is forbidden', async () => {
    const res = await request(`/api/tenants/${tenantB.id}`, {
      method: 'PATCH',
      token: ownerA.token,
      body: { name: 'Hijacked Studio' },
    });
    assert.ok(res.status === 403 || res.status === 404, String(res.status));
  });

  test('stranger cannot cancel another member booking', async () => {
    const res = await request(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      token: stranger.token,
    });
    assert.ok(res.status === 403 || res.status === 404, String(res.status));
  });

  test('owner B cannot list owner A tenant bookings', async () => {
    const res = await request(`/api/tenants/${tenantA.id}/bookings`, {
      token: ownerB.token,
    });
    assert.ok(res.status === 403 || res.status === 404, String(res.status));
  });

  test('local video static path is closed', async () => {
    const res = await request(`/uploads/${tenantA.id}/video/${'a'.repeat(24)}.mp4`);
    assert.equal(res.status, 404);
  });

  test('helmet security headers present', async () => {
    const res = await request('/api/health');
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('x-content-type-options'));
    assert.ok(res.headers.get('x-frame-options') || res.headers.get('content-security-policy') === null);
  });

  test('oversized JSON body is rejected', async () => {
    const huge = 'x'.repeat(1.5 * 1024 * 1024);
    const res = await request('/api/auth/login', {
      method: 'POST',
      rawBody: `{"email":"a@b.c","password":"${huge}"}`,
      headers: { 'content-type': 'application/json' },
    });
    assert.ok(
      res.status === 413 || res.status === 400 || res.status === 500,
      `expected payload reject, got ${res.status}`,
    );
  });
});

describe('load and page latency', () => {
  let publicSlug = null;

  before(async () => {
    const owner = await register('Load Owner', `lim-load-owner-${stamp}@example.com`, 'BUSINESS_OWNER');
    await acceptConsent(owner.token);
    const tenant = await request('/api/tenants', {
      method: 'POST',
      token: owner.token,
      body: { name: `Load Studio ${stamp}`, niche: 'fitness' },
    });
    assert.equal(tenant.status, 201, JSON.stringify(tenant.body));
    publicSlug = tenant.body.tenant.slug;
  });

  test('health endpoint sustains burst (p95 < 500ms)', async () => {
    const CONCURRENCY = 80;
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, () => request('/api/health')),
    );
    const failed = results.filter((item) => item.status !== 200);
    assert.equal(failed.length, 0, `${failed.length} health failures`);
    const p95 = percentile(results.map((item) => item.ms), 95);
    assert.ok(p95 < 500, `health p95 ${p95.toFixed(1)}ms`);
  });

  test('public tenant profile sustains burst (p95 < 1500ms)', async () => {
    assert.ok(publicSlug);
    const CONCURRENCY = 40;
    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }, () => request(`/api/tenants/${publicSlug}/public`)),
    );
    const failed = results.filter((item) => item.status !== 200);
    assert.equal(failed.length, 0, `${failed.length} public failures`);
    const p95 = percentile(results.map((item) => item.ms), 95);
    assert.ok(p95 < 1500, `public p95 ${p95.toFixed(1)}ms`);
  });

  test('mixed read storm stays mostly healthy', async () => {
    const jobs = [];
    for (let i = 0; i < 60; i += 1) {
      if (i % 3 === 0) jobs.push(request('/api/health'));
      else if (i % 3 === 1) jobs.push(request(`/api/tenants/${publicSlug}/public`));
      else jobs.push(request('/api/tenants/discover?limit=6'));
    }
    const results = await Promise.all(jobs);
    const okCount = results.filter((item) => item.status === 200).length;
    assert.ok(okCount / results.length >= 0.95, `ok ratio ${okCount}/${results.length}`);
    const p95 = percentile(results.map((item) => item.ms), 95);
    assert.ok(p95 < 2000, `mixed p95 ${p95.toFixed(1)}ms`);
  });

  test('SPA shell (if built) loads under budget', async () => {
    const res = await request('/');
    if (res.status === 404 || (typeof res.body === 'object' && res.body?.code === 'NOT_FOUND')) {
      // No client/dist in this run — skip soft.
      return;
    }
    assert.equal(res.status, 200);
    const html = String(res.text || '');
    assert.ok(/<!doctype html>/i.test(html) || /<html[\s>]/i.test(html), 'expected HTML shell');
    assert.ok(res.ms < 2000, `SPA TTFB ${res.ms.toFixed(1)}ms`);
  });

  test('concurrent booking attempts do not 500 the API', async () => {
    const owner = await register('Burst Owner', `lim-burst-owner-${stamp}@example.com`, 'BUSINESS_OWNER');
    await acceptConsent(owner.token);
    const tenant = await request('/api/tenants', {
      method: 'POST',
      token: owner.token,
      body: { name: `Burst Studio ${stamp}`, niche: 'fitness' },
    });
    assert.equal(tenant.status, 201);
    const tenantId = tenant.body.tenant.id;

    await request(`/api/tenants/${tenantId}`, {
      method: 'PATCH',
      token: owner.token,
      body: {
        bookingSettings: {
          capacityModel: 'PER_SLOT',
          workingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
            day,
            closed: false,
            open: '07:00',
            close: '22:00',
          })),
        },
      },
    });

    const service = await request(`/api/tenants/${tenantId}/services`, {
      method: 'POST',
      token: owner.token,
      body: {
        name: 'Burst',
        durationMinutes: 30,
        slotIntervalMinutes: 30,
        capacity: 1,
        cancellationWindowMinutes: 15,
        price: 0,
        membershipRequired: false,
      },
    });
    assert.equal(service.status, 201, JSON.stringify(service.body));
    const serviceId = service.body.service.id;

    const trainer = await request(`/api/tenants/${tenantId}/staff`, {
      method: 'POST',
      token: owner.token,
      body: {
        name: 'Burst Trainer',
        email: `lim-burst-trainer-${stamp}@example.com`,
        title: 'Trener',
      },
    });
    assert.equal(trainer.status, 201, JSON.stringify(trainer.body));
    ids.users.push(trainer.body.staff.id);
    const staffId = trainer.body.staff.id;
    const visitDate = addDays(zonedNow('Europe/Zagreb').date, 2);

    const members = [];
    for (let i = 0; i < 8; i += 1) {
      const m = await register(`Burst M${i}`, `lim-burst-m${i}-${stamp}@example.com`);
      await acceptConsent(m.token);
      members.push(m);
    }

    const availability = await request(
      `/api/tenants/${tenantId}/services/${serviceId}/availability?date=${visitDate}`,
      { token: members[0].token },
    );
    assert.equal(availability.status, 200);
    const slot = (availability.body.slots || []).find((item) => item.status === 'AVAILABLE');
    assert.ok(slot, 'need available slot for capacity race');

    const attempts = await Promise.all(members.map((m) => request('/api/bookings', {
      method: 'POST',
      token: m.token,
      body: {
        serviceId,
        date: visitDate,
        startTime: slot.startTime,
        userId: m.user.id,
        staffId,
      },
    })));

    const serverErrors = attempts.filter((item) => item.status >= 500);
    assert.equal(serverErrors.length, 0, `unexpected 5xx: ${JSON.stringify(serverErrors[0]?.body)}`);
    const created = attempts.filter((item) => item.status === 201).length;
    const summary = attempts.map((item) => item.status);
    assert.equal(
      created,
      1,
      `capacity=1 expected exactly 1 booking, got ${created} statuses=${JSON.stringify(summary)} body0=${JSON.stringify(attempts[0]?.body)}`,
    );
  });
});

describe('auth flood (last — shares IP rate limiter)', () => {
  test('auth rate limit eventually trips', async () => {
    const email = `lim-flood-${stamp}@example.com`;
    let hit429 = false;
    for (let i = 0; i < 25; i += 1) {
      const res = await request('/api/auth/login', {
        method: 'POST',
        body: { email, password: 'Wrong-Pass-999!' },
      });
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }
    assert.equal(hit429, true, 'expected 429 after auth flood');
  });
});
