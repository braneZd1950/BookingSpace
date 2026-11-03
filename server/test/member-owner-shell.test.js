import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { addDays, zonedNow } from '../src/utils/time.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(32).toString('base64url');
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.EMAIL_FROM = '';

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/config/db.js');
const { default: Booking } = await import('../src/models/Booking.js');
const { default: Membership } = await import('../src/models/Membership.js');
const { default: MembershipPlan } = await import('../src/models/MembershipPlan.js');
const { default: Payment } = await import('../src/models/Payment.js');
const { default: Service } = await import('../src/models/Service.js');
const { default: Tenant } = await import('../src/models/Tenant.js');
const { default: TenantUser } = await import('../src/models/TenantUser.js');
const { default: User } = await import('../src/models/User.js');

const created = { userIds: [], tenantId: null };
let server;
let baseUrl;

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
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function acceptConsent(token) {
  const res = await request('/api/consent', {
    method: 'POST',
    token,
    body: { action: 'accept', version: '2026-10-13', source: 'settings' },
  });
  assert.equal(res.status, 200);
}

before(async () => {
  await connectDb();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (created.tenantId) {
    const tenantId = created.tenantId;
    await Booking.deleteMany({ tenantId });
    await Membership.deleteMany({ tenantId });
    await Payment.deleteMany({ tenantId });
    await MembershipPlan.deleteMany({ tenantId });
    await Service.deleteMany({ tenantId });
    await TenantUser.deleteMany({ tenantId });
    await Tenant.deleteOne({ _id: tenantId });
  }
  if (created.userIds.length > 0) {
    await User.deleteMany({ _id: { $in: created.userIds } });
  }
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

/**
 * API contract shared by web `/s/:slug` and mobile `/(member)/:slug`:
 * owner → BUSINESS_OWNER + /tenants/mine
 * member → CUSTOMER + /memberships/my slug → public tenant + self-book
 */
test('member vs owner shell: login roles, memberships/my, public tenant, self-book', { timeout: 90000 }, async () => {
  const stamp = Date.now();
  const ownerEmail = `shell-owner-${stamp}@example.com`;
  const memberEmail = `shell-member-${stamp}@example.com`;
  const password = 'ShellTest-123!';

  const ownerReg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Shell Owner',
      email: ownerEmail,
      password,
      role: 'BUSINESS_OWNER',
    },
  });
  assert.equal(ownerReg.status, 201);
  created.userIds.push(ownerReg.body.user.id);
  assert.equal(ownerReg.body.user.role, 'BUSINESS_OWNER');
  const ownerToken = ownerReg.body.token;
  await acceptConsent(ownerToken);

  const tenantRes = await request('/api/tenants', {
    method: 'POST',
    token: ownerToken,
    body: { name: `Shell Studio ${stamp}`, niche: 'fitness' },
  });
  assert.equal(tenantRes.status, 201);
  const tenant = tenantRes.body.tenant;
  created.tenantId = tenant.id;

  const mineOwner = await request('/api/tenants/mine', { token: ownerToken });
  assert.equal(mineOwner.status, 200);
  const owned = (mineOwner.body.tenants || []).find((row) => row.role === 'BUSINESS_OWNER');
  assert.ok(owned?.tenant?.id);
  assert.equal(owned.tenant.slug, tenant.slug);

  await request(`/api/tenants/${tenant.id}`, {
    method: 'PATCH',
    token: ownerToken,
    body: {
      oib: '12345678901',
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

  const mineOwnerAfter = await request('/api/tenants/mine', { token: ownerToken });
  assert.equal(mineOwnerAfter.status, 200);
  const ownedAfter = (mineOwnerAfter.body.tenants || []).find((row) => row.tenant?.id === tenant.id);
  assert.equal(ownedAfter?.tenant?.oib, '12345678901');

  const service = await request(`/api/tenants/${tenant.id}/services`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: 'Grupni trening',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 12,
      cancellationWindowMinutes: 60,
      price: 0,
      membershipRequired: true,
    },
  });
  assert.equal(service.status, 201);

  const plan = await request(`/api/tenants/${tenant.id}/membership-plans`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: '12 treninga',
      price: 0,
      validityDays: 30,
      sessionsIncluded: 12,
      allowedServiceIds: [service.body.service.id],
    },
  });
  assert.equal(plan.status, 201);

  const memberReg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Shell Member',
      email: memberEmail,
      password,
      role: 'CUSTOMER',
    },
  });
  assert.equal(memberReg.status, 201);
  created.userIds.push(memberReg.body.user.id);
  assert.equal(memberReg.body.user.role, 'CUSTOMER');
  const memberToken = memberReg.body.token;
  await acceptConsent(memberToken);

  const membership = await request(`/api/tenants/${tenant.id}/memberships`, {
    method: 'POST',
    token: ownerToken,
    body: {
      userId: memberReg.body.user.id,
      membershipPlanId: plan.body.plan.id,
      method: 'CASH',
      amount: 0,
    },
  });
  assert.equal(
    membership.status,
    201,
    `membership create failed: ${JSON.stringify(membership.body)}`,
  );

  const mineMember = await request('/api/tenants/mine', { token: memberToken });
  assert.equal(mineMember.status, 200);
  const memberRow = (mineMember.body.tenants || []).find((row) => row.tenant?.id === tenant.id);
  assert.ok(memberRow, 'member should see studio via tenants/mine');
  assert.equal(memberRow.role, 'CUSTOMER');
  assert.equal(memberRow.tenant.oib, undefined);
  assert.ok(!('blockedPeriods' in (memberRow.tenant.bookingSettings || {})));

  const myMemberships = await request('/api/memberships/my?limit=50', { token: memberToken });
  assert.equal(myMemberships.status, 200);
  const active = (myMemberships.body.memberships || []).find(
    (item) => item.status === 'ACTIVE' && item.tenant?.slug === tenant.slug,
  );
  assert.ok(active, 'member shell needs ACTIVE membership with tenant.slug');

  const pub = await request(`/api/tenants/${tenant.slug}/public`);
  assert.equal(pub.status, 200);
  assert.equal(pub.body.tenant.slug, tenant.slug);
  assert.ok((pub.body.tenant.services || []).length >= 1);

  const trainerRes = await request(`/api/tenants/${tenant.id}/staff`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: 'Shell Trainer',
      email: `shell-trainer-${stamp}@example.com`,
      title: 'Trener',
    },
  });
  assert.equal(trainerRes.status, 201);
  created.userIds.push(trainerRes.body.staff.id);
  const staffId = trainerRes.body.staff.id;

  const visitDate = addDays(zonedNow('Europe/Zagreb').date, 1);
  const availability = await request(
    `/api/tenants/${tenant.id}/services/${service.body.service.id}/availability?date=${visitDate}`,
    { token: memberToken },
  );
  assert.equal(availability.status, 200);
  const slot = (availability.body.slots || []).find((item) => item.status === 'AVAILABLE');
  assert.ok(slot, 'need an available slot for member self-book');

  const booked = await request('/api/bookings', {
    method: 'POST',
    token: memberToken,
    body: {
      serviceId: service.body.service.id,
      date: visitDate,
      startTime: slot.startTime,
      userId: memberReg.body.user.id,
      staffId,
    },
  });
  assert.equal(
    booked.status,
    201,
    `member self-book failed: ${JSON.stringify(booked.body)}`,
  );

  const mine = await request('/api/bookings/my?limit=50', { token: memberToken });
  assert.equal(mine.status, 200);
  assert.ok((mine.body.bookings || []).some((item) => item.status === 'CONFIRMED'));
});
