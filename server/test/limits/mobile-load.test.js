/**
 * Deep mobile-client load harness (not part of default `npm test`).
 * Simulates Expo app traffic patterns against the shared API.
 *
 * Run:
 *   npm run test:limits
 *   npm --prefix server run test:mobile-load
 *
 * Covers: cold open, guest browse, discover, session restore, membership,
 * availability, concurrent bookings, settings/theme PATCH, consent, owner tools.
 */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
// Isolate from shell/.env Atlas before any server module loads.
delete process.env.MONGO_URI;

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { addDays, zonedNow } = await import('../../src/utils/time.js');
const { signAccessToken } = await import('../../src/utils/token.js');
const { default: app } = await import('../../src/app.js');
const { connectDb, disconnectDb } = await import('../../src/config/db.js');
const { default: User } = await import('../../src/models/User.js');

const stamp = Date.now();
const password = 'Mobile-Load-Pass-123!';

let server;
let baseUrl;
const ids = { users: [] };

const report = {
  suites: [],
};

async function request(path, {
  method = 'GET',
  token,
  body,
  headers: extra = {},
} = {}) {
  const headers = { ...extra };
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;

  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
  return { status: response.status, body: payload, ms, text };
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

function summarize(label, results, { maxP95, minOkRatio = 1 } = {}) {
  const statuses = results.map((item) => item.status);
  const times = results.map((item) => item.ms);
  const ok = results.filter((item) => item.status >= 200 && item.status < 400).length;
  const serverErr = results.filter((item) => item.status >= 500).length;
  const p50 = percentile(times, 50);
  const p95 = percentile(times, 95);
  const p99 = percentile(times, 99);
  const max = Math.max(...times);
  const row = {
    label,
    n: results.length,
    ok,
    serverErr,
    okRatio: ok / results.length,
    p50: Number(p50.toFixed(1)),
    p95: Number(p95.toFixed(1)),
    p99: Number(p99.toFixed(1)),
    max: Number(max.toFixed(1)),
  };
  report.suites.push(row);
  // eslint-disable-next-line no-console
  console.log(
    `[mobile-load] ${label}: n=${row.n} ok=${row.ok}/${row.n} 5xx=${row.serverErr} `
    + `p50=${row.p50}ms p95=${row.p95}ms p99=${row.p99}ms max=${row.max}ms`,
  );
  assert.equal(serverErr, 0, `${label}: unexpected 5xx (statuses=${JSON.stringify(statuses.slice(0, 12))})`);
  assert.ok(row.okRatio >= minOkRatio, `${label}: ok ratio ${row.ok}/${row.n}`);
  if (maxP95 != null) {
    assert.ok(p95 < maxP95, `${label}: p95 ${p95.toFixed(1)}ms >= ${maxP95}ms`);
  }
  return row;
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

/** Seed many members without hitting auth rate limiter (20 / 15min / IP). */
async function seedMember(name, email) {
  const passwordHash = await bcrypt.hash(password, 4);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'CUSTOMER',
    privacyConsent: {
      accepted: true,
      version: '2026-10-13',
      acceptedAt: new Date(),
      source: 'settings',
    },
  });
  ids.users.push(user._id);
  return {
    user: { id: String(user._id), email, name, role: 'CUSTOMER' },
    token: signAccessToken(user),
  };
}

async function acceptConsent(token) {
  const res = await request('/api/consent', {
    method: 'POST',
    token,
    body: { action: 'accept', version: '2026-10-13', source: 'banner' },
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
}

async function login(email) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res.body;
}

/** One cold-open sequence like Expo member home + tabs prefetch. */
async function mobileColdOpen({ slug, token, tenantId, serviceId, visitDate }) {
  const steps = [];
  steps.push(await request(`/api/tenants/${slug}/public`));
  steps.push(await request('/api/tenants/discover?limit=60'));
  if (token) {
    steps.push(await request('/api/auth/me', { token }));
    steps.push(await request('/api/memberships/my?limit=50', { token }));
    steps.push(await request('/api/bookings/my?limit=50', { token }));
    if (tenantId && serviceId && visitDate) {
      steps.push(await request(
        `/api/tenants/${tenantId}/services/${serviceId}/availability?date=${visitDate}`,
        { token },
      ));
    }
  }
  const worst = Math.max(...steps.map((item) => item.ms));
  const bad = steps.find((item) => item.status >= 500);
  return {
    status: bad ? bad.status : 200,
    ms: worst,
    steps,
  };
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
  // eslint-disable-next-line no-console
  console.log('[mobile-load] SUMMARY', JSON.stringify(report.suites, null, 2));
});

describe('mobile full-load (Expo API paths)', () => {
  let owner;
  let tenant;
  let service;
  let staffId;
  let planId;
  let visitDate;
  const members = [];

  before(async () => {
    owner = await register('Mobile Load Owner', `mob-load-owner-${stamp}@example.com`, 'BUSINESS_OWNER');
    await acceptConsent(owner.token);

    const created = await request('/api/tenants', {
      method: 'POST',
      token: owner.token,
      body: { name: `Mobile Load Studio ${stamp}`, niche: 'fitness', oib: '33333333333' },
    });
    assert.equal(created.status, 201, JSON.stringify(created.body));
    tenant = created.body.tenant;

    await request(`/api/tenants/${tenant.id}`, {
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

    const svc = await request(`/api/tenants/${tenant.id}/services`, {
      method: 'POST',
      token: owner.token,
      body: {
        name: 'Mobile Session',
        durationMinutes: 30,
        slotIntervalMinutes: 30,
        capacity: 12,
        cancellationWindowMinutes: 60,
        price: 0,
        membershipRequired: true,
      },
    });
    assert.equal(svc.status, 201, JSON.stringify(svc.body));
    service = svc.body.service;

    const plan = await request(`/api/tenants/${tenant.id}/membership-plans`, {
      method: 'POST',
      token: owner.token,
      body: {
        name: 'Mobile Plan',
        price: 0,
        validityDays: 30,
        sessionsIncluded: 40,
        allowedServiceIds: [service.id],
      },
    });
    assert.equal(plan.status, 201, JSON.stringify(plan.body));
    planId = plan.body.plan.id;

    const trainer = await request(`/api/tenants/${tenant.id}/staff`, {
      method: 'POST',
      token: owner.token,
      body: {
        name: 'Mobile Trainer',
        email: `mob-load-trainer-${stamp}@example.com`,
        title: 'Trener',
      },
    });
    assert.equal(trainer.status, 201, JSON.stringify(trainer.body));
    ids.users.push(trainer.body.staff.id);
    staffId = trainer.body.staff.id;

    for (let i = 0; i < 24; i += 1) {
      const member = await seedMember(`Mob Member ${i}`, `mob-load-m${i}-${stamp}@example.com`);
      const membership = await request(`/api/tenants/${tenant.id}/memberships`, {
        method: 'POST',
        token: owner.token,
        body: {
          userId: member.user.id,
          membershipPlanId: planId,
          method: 'CASH',
          amount: 0,
        },
      });
      assert.equal(membership.status, 201, JSON.stringify(membership.body));
      members.push(member);
    }

    visitDate = addDays(zonedNow('Europe/Zagreb').date, 3);
  });

  test('guest browse storm (public + discover) p95 < 2000ms', async () => {
    const CONCURRENCY = 100;
    const results = await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => (
      i % 2 === 0
        ? request(`/api/tenants/${tenant.slug}/public`)
        : request('/api/tenants/discover?limit=60')
    )));
    summarize('guest-browse', results, { maxP95: 2000, minOkRatio: 1 });
  });

  test('session restore storm (auth/me) p95 < 800ms', async () => {
    const results = await Promise.all(
      members.map((m) => request('/api/auth/me', { token: m.token })),
    );
    summarize('session-restore', results, { maxP95: 800, minOkRatio: 1 });
  });

  test('member shell cold-open × concurrent users p95 < 2500ms', async () => {
    const wave = members.slice(0, 20);
    const results = await Promise.all(wave.map((m) => mobileColdOpen({
      slug: tenant.slug,
      token: m.token,
      tenantId: tenant.id,
      serviceId: service.id,
      visitDate,
    })));
    summarize('cold-open', results, { maxP95: 2500, minOkRatio: 1 });
  });

  test('availability refresh storm (termini screen) p95 < 2000ms', async () => {
    const CONCURRENCY = 60;
    const results = await Promise.all(Array.from({ length: CONCURRENCY }, (_, i) => {
      const member = members[i % members.length];
      return request(
        `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
        { token: member.token },
      );
    }));
    summarize('availability', results, { maxP95: 2000, minOkRatio: 1 });
  });

  test('settings/theme PATCH storm stays stable', async () => {
    const themes = ['system', 'light', 'dark'];
    const wave = members.slice(0, 18);
    const results = await Promise.all(wave.map((m, i) => request('/api/auth/me', {
      method: 'PATCH',
      token: m.token,
      body: {
        uiTheme: themes[i % themes.length],
        notificationPrefs: {
          bookingEmail: i % 2 === 0,
          cancelEmail: true,
          marketing: false,
          reminderPush: i % 3 === 0,
        },
      },
    })));
    summarize('settings-patch', results, { maxP95: 1200, minOkRatio: 1 });
  });

  test('consent accept/withdraw churn does not 500', async () => {
    const wave = members.slice(0, 12);
    const withdraw = await Promise.all(wave.map((m) => request('/api/auth/me', {
      method: 'PATCH',
      token: m.token,
      body: {
        privacyConsent: {
          action: 'withdraw',
          version: '2026-10-13',
          source: 'settings',
          path: '/mobile',
        },
      },
    })));
    summarize('consent-withdraw', withdraw, { maxP95: 1500, minOkRatio: 1 });

    const accept = await Promise.all(wave.map((m) => request('/api/consent', {
      method: 'POST',
      token: m.token,
      body: { action: 'accept', version: '2026-10-13', source: 'banner' },
    })));
    summarize('consent-accept', accept, { maxP95: 1500, minOkRatio: 1 });
  });

  test('concurrent bookings under capacity (no 5xx, respect seats)', async () => {
    const availability = await request(
      `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
      { token: members[0].token },
    );
    assert.equal(availability.status, 200);
    const slot = (availability.body.slots || []).find((item) => item.status === 'AVAILABLE');
    assert.ok(slot, 'need available slot');

    const capacity = Number(service.capacity) || 12;
    const challengers = members.slice(0, capacity + 8);
    const attempts = await Promise.all(challengers.map((m) => request('/api/bookings', {
      method: 'POST',
      token: m.token,
      body: {
        serviceId: service.id,
        date: visitDate,
        startTime: slot.startTime,
        userId: m.user.id,
        staffId,
      },
    })));

    const created = attempts.filter((item) => item.status === 201);
    const rejected = attempts.filter((item) => item.status !== 201);
    const serverErr = attempts.filter((item) => item.status >= 500);
    assert.equal(serverErr.length, 0, `booking 5xx: ${JSON.stringify(serverErr[0]?.body)}`);
    assert.ok(created.length <= capacity, `created ${created.length} > capacity ${capacity}`);
    assert.ok(created.length >= 1, 'expected at least one booking');
    assert.ok(rejected.length >= 1, 'expected some capacity rejections');
    summarize('bookings-race', attempts, { maxP95: 3000, minOkRatio: 0 });
  });

  test('owner tools read storm (termini/kalendar/clanovi) p95 < 2500ms', async () => {
    const jobs = [];
    for (let i = 0; i < 45; i += 1) {
      if (i % 3 === 0) {
        jobs.push(request(
          `/api/tenants/${tenant.id}/bookings?date=${visitDate}&limit=100`,
          { token: owner.token },
        ));
      } else if (i % 3 === 1) {
        jobs.push(request(
          `/api/tenants/${tenant.id}/memberships?limit=100`,
          { token: owner.token },
        ));
      } else {
        jobs.push(request(
          `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
          { token: owner.token },
        ));
      }
    }
    const results = await Promise.all(jobs);
    summarize('owner-tools', results, { maxP95: 2500, minOkRatio: 1 });
  });

  test('login + cold-open soak (under auth rate budget) stays healthy', async () => {
    // Auth limiter = 20 / 15min / IP; owner+trainer already used a few — keep ≤ 8 logins.
    const batch = members.slice(0, 8);
    const logins = [];
    for (const m of batch) {
      logins.push(await login(m.user.email));
    }
    const opens = await Promise.all(logins.map((session) => mobileColdOpen({
      slug: tenant.slug,
      token: session.token,
      tenantId: tenant.id,
      serviceId: service.id,
      visitDate,
    })));
    summarize('login-soak', opens, { maxP95: 3000, minOkRatio: 1 });
  });

  test('mixed mobile chaos (guest + member + owner) ok ≥ 95%, no 5xx', async () => {
    const jobs = [];
    for (let i = 0; i < 120; i += 1) {
      const r = i % 5;
      if (r === 0) jobs.push(request(`/api/tenants/${tenant.slug}/public`));
      else if (r === 1) jobs.push(request('/api/tenants/discover?limit=24'));
      else if (r === 2) {
        const m = members[i % members.length];
        jobs.push(request('/api/auth/me', { token: m.token }));
      } else if (r === 3) {
        const m = members[i % members.length];
        jobs.push(request('/api/memberships/my?limit=50', { token: m.token }));
      } else {
        jobs.push(request(
          `/api/tenants/${tenant.id}/bookings?limit=50`,
          { token: owner.token },
        ));
      }
    }
    const results = await Promise.all(jobs);
    summarize('chaos-mix', results, { maxP95: 3500, minOkRatio: 0.95 });
  });
});
