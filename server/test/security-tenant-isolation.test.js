import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Mandatory A↔B tenant isolation matrix (Studio A must not touch Studio B).
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
process.env.EXPORT_SEAL_SECRET = randomBytes(32).toString('base64url');

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/config/db.js');
const { addDays, zonedNow } = await import('../src/utils/time.js');

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
  return { status: response.status, body: parsed };
}

async function register(name, email, role = 'CUSTOMER') {
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

async function createStudio(owner, name) {
  const tenant = await request('/api/tenants', {
    method: 'POST',
    token: owner.token,
    body: { name, niche: 'fitness' },
  });
  assert.equal(tenant.status, 201);
  const tenantId = tenant.body.tenant.id;

  const hours = await request(`/api/tenants/${tenantId}`, {
    method: 'PATCH',
    token: owner.token,
    body: {
      bookingSettings: {
        capacityModel: 'PER_SLOT',
        workingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
          day,
          closed: false,
          open: '08:00',
          close: '20:00',
        })),
      },
    },
  });
  assert.equal(hours.status, 200);

  const service = await request(`/api/tenants/${tenantId}/services`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: 'Session',
      durationMinutes: 30,
      slotIntervalMinutes: 30,
      capacity: 4,
      price: 0,
      membershipRequired: true,
    },
  });
  assert.equal(service.status, 201);
  const plan = await request(`/api/tenants/${tenantId}/membership-plans`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: 'Plan',
      price: 0,
      validityDays: 30,
      sessionsIncluded: 5,
      allowedServiceIds: [service.body.service.id],
    },
  });
  assert.equal(plan.status, 201);
  return {
    tenant: tenant.body.tenant,
    service: service.body.service,
    plan: plan.body.plan,
  };
}

let ownerA;
let ownerB;
let memberA;
let memberB;
let studioA;
let studioB;
let bookingB;
let membershipB;
let visitDate;

before(async () => {
  await connectDb();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  ownerA = await register('Iso Owner A', `iso-a-${stamp}@example.com`, 'BUSINESS_OWNER');
  ownerB = await register('Iso Owner B', `iso-b-${stamp}@example.com`, 'BUSINESS_OWNER');
  memberA = await register('Iso Mem A', `iso-ma-${stamp}@example.com`, 'CUSTOMER');
  memberB = await register('Iso Mem B', `iso-mb-${stamp}@example.com`, 'CUSTOMER');
  await Promise.all([
    consent(ownerA.token),
    consent(ownerB.token),
    consent(memberA.token),
    consent(memberB.token),
  ]);

  studioA = await createStudio(ownerA, `Iso Studio A ${stamp}`);
  studioB = await createStudio(ownerB, `Iso Studio B ${stamp}`);

  const memA = await request(`/api/tenants/${studioA.tenant.id}/memberships`, {
    method: 'POST',
    token: ownerA.token,
    body: {
      membershipPlanId: studioA.plan.id,
      method: 'CASH',
      userId: memberA.user.id,
    },
  });
  assert.equal(memA.status, 201);

  const memB = await request(`/api/tenants/${studioB.tenant.id}/memberships`, {
    method: 'POST',
    token: ownerB.token,
    body: {
      membershipPlanId: studioB.plan.id,
      method: 'CASH',
      userId: memberB.user.id,
    },
  });
  assert.equal(memB.status, 201);
  membershipB = memB.body.membership;

  visitDate = addDays(zonedNow('Europe/Zagreb').date, 2);
  const publicB = await request(`/api/tenants/${studioB.tenant.slug}/public`);
  assert.equal(publicB.status, 200);
  const staffId = publicB.body.tenant.trainers?.[0]?.id;
  assert.ok(staffId);

  const avail = await request(
    `/api/tenants/${studioB.tenant.id}/services/${studioB.service.id}/availability?date=${visitDate}`,
  );
  assert.equal(avail.status, 200);
  const openSlot = (avail.body.slots || []).find(
    (slot) => slot.status === 'AVAILABLE' || Number(slot.available) > 0,
  );
  assert.ok(openSlot, 'expected an open slot for isolation booking');

  const book = await request('/api/bookings', {
    method: 'POST',
    token: memberB.token,
    body: {
      serviceId: studioB.service.id,
      date: visitDate,
      startTime: openSlot.startTime,
      staffId,
    },
  });
  assert.equal(book.status, 201, JSON.stringify(book.body));
  bookingB = book.body.booking;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

describe('A↔B tenant isolation', () => {
  test('1 A cannot GET customer B via tenant A', async () => {
    const res = await request(
      `/api/tenants/${studioA.tenant.id}/customers/${memberB.user.id}`,
      { token: ownerA.token },
    );
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('1b A cannot GET customer B via tenant B', async () => {
    const res = await request(
      `/api/tenants/${studioB.tenant.id}/customers/${memberB.user.id}`,
      { token: ownerA.token },
    );
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('2 A cannot activate membership for member B on tenant B', async () => {
    const res = await request(`/api/tenants/${studioB.tenant.id}/memberships`, {
      method: 'POST',
      token: ownerA.token,
      body: {
        membershipPlanId: studioB.plan.id,
        method: 'CASH',
        userId: memberB.user.id,
      },
    });
    assert.ok([401, 403, 404].includes(res.status), String(res.status));
  });

  test('4 A cannot list bookings of tenant B', async () => {
    const res = await request(`/api/tenants/${studioB.tenant.id}/bookings`, {
      token: ownerA.token,
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('5 A cannot cancel booking B', async () => {
    const res = await request(`/api/bookings/${bookingB.id}/cancel`, {
      method: 'PATCH',
      token: ownerA.token,
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('5b A cannot complete booking B', async () => {
    const res = await request(`/api/bookings/${bookingB.id}/complete`, {
      method: 'PATCH',
      token: ownerA.token,
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('5c A cannot mark no-show on booking B', async () => {
    const res = await request(`/api/bookings/${bookingB.id}/no-show`, {
      method: 'PATCH',
      token: ownerA.token,
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('6 A spoofed body tenantId does not grant B access', async () => {
    const res = await request(`/api/tenants/${studioB.tenant.id}`, {
      method: 'PATCH',
      token: ownerA.token,
      body: { name: 'Nope', tenantId: studioA.tenant.id },
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('7 A cannot hit platform analytics', async () => {
    const res = await request('/api/analytics/platform', { token: ownerA.token });
    assert.equal(res.status, 403);
  });

  test('8 unauthenticated private route is 401', async () => {
    const res = await request(`/api/tenants/${studioA.tenant.id}/bookings`);
    assert.equal(res.status, 401);
  });

  test('9 self-promote role via PATCH /auth/me is ignored', async () => {
    const res = await request('/api/auth/me', {
      method: 'PATCH',
      token: memberA.token,
      body: { role: 'ADMIN', name: 'Still Member' },
    });
    // Zod strips unknown keys or rejects — either way role must stay CUSTOMER.
    assert.ok([200, 400, 422].includes(res.status), String(res.status));
    const me = await request('/api/auth/me', { token: memberA.token });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.role, 'CUSTOMER');
    assert.equal(me.body.platformAdmin, false);
  });

  test('10 A cannot PATCH service B by id', async () => {
    const res = await request(`/api/services/${studioB.service.id}`, {
      method: 'PATCH',
      token: ownerA.token,
      body: { name: 'Stolen' },
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('10b A cannot PATCH membership plan B by id', async () => {
    const res = await request(`/api/membership-plans/${studioB.plan.id}`, {
      method: 'PATCH',
      token: ownerA.token,
      body: { name: 'Stolen plan' },
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('10c A cannot suspend membership B', async () => {
    const res = await request(`/api/memberships/${membershipB.id}/suspend`, {
      method: 'PATCH',
      token: ownerA.token,
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('10d A cannot record payment for member B under tenant A', async () => {
    const res = await request(`/api/tenants/${studioA.tenant.id}/payments`, {
      method: 'POST',
      token: ownerA.token,
      body: {
        userId: memberB.user.id,
        amount: 10,
        method: 'CASH',
      },
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });

  test('10e A cannot book for member B on tenant A without link', async () => {
    const publicA = await request(`/api/tenants/${studioA.tenant.slug}/public`);
    const staffId = publicA.body.tenant.trainers?.[0]?.id;
    const avail = await request(
      `/api/tenants/${studioA.tenant.id}/services/${studioA.service.id}/availability?date=${visitDate}`,
    );
    const openSlot = (avail.body.slots || []).find(
      (slot) => slot.status === 'AVAILABLE' || Number(slot.available) > 0,
    );
    const res = await request('/api/bookings', {
      method: 'POST',
      token: ownerA.token,
      body: {
        serviceId: studioA.service.id,
        date: visitDate,
        startTime: openSlot?.startTime || '11:00',
        userId: memberB.user.id,
        staffId,
      },
    });
    assert.ok([403, 404].includes(res.status), String(res.status));
  });
});
