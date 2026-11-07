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

let server;
let baseUrl;
const stamp = Date.now();
const cleanupTenantIds = [];
const cleanupUserIds = [];

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

async function register(name, email, role = 'CUSTOMER') {
  const res = await request('/api/auth/register', {
    method: 'POST',
    body: { name, email, password: 'SecurePass1!', role },
  });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  cleanupUserIds.push(res.body.user.id);
  await acceptConsent(res.body.token);
  return res.body;
}

async function openStudio(ownerToken, name) {
  const tenantRes = await request('/api/tenants', {
    method: 'POST',
    token: ownerToken,
    body: { name, niche: 'fitness' },
  });
  assert.equal(tenantRes.status, 201, JSON.stringify(tenantRes.body));
  const tenant = tenantRes.body.tenant;
  cleanupTenantIds.push(tenant.id);

  const patch = await request(`/api/tenants/${tenant.id}`, {
    method: 'PATCH',
    token: ownerToken,
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
  assert.equal(patch.status, 200, JSON.stringify(patch.body));
  return tenant;
}

before(async () => {
  await connectDb();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  for (const tenantId of cleanupTenantIds) {
    await Booking.deleteMany({ tenantId });
    await Membership.deleteMany({ tenantId });
    await Payment.deleteMany({ tenantId });
    await MembershipPlan.deleteMany({ tenantId });
    await Service.deleteMany({ tenantId });
    await TenantUser.deleteMany({ tenantId });
    await Tenant.deleteOne({ _id: tenantId });
  }
  if (cleanupUserIds.length) await User.deleteMany({ _id: { $in: cleanupUserIds } });
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

test('overlapping interval grid: capacity-1 allows only one concurrent winner', { timeout: 120000 }, async () => {
  const owner = await register('Race Owner', `race-owner-${stamp}@example.com`, 'BUSINESS_OWNER');
  const tenant = await openStudio(owner.token, `Race Studio ${stamp}`);

  const serviceRes = await request(`/api/tenants/${tenant.id}/services`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: 'Overlap PT',
      durationMinutes: 60,
      slotIntervalMinutes: 30,
      capacity: 1,
      price: 0,
      membershipRequired: true,
    },
  });
  assert.equal(serviceRes.status, 201, JSON.stringify(serviceRes.body));
  const serviceId = serviceRes.body.service.id;

  const planRes = await request(`/api/tenants/${tenant.id}/membership-plans`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: 'Pack',
      price: 0,
      validityDays: 90,
      sessionsIncluded: 20,
      allowedServiceIds: [serviceId],
    },
  });
  assert.equal(planRes.status, 201, JSON.stringify(planRes.body));
  const planId = planRes.body.plan.id;

  const memberIds = [];
  for (let i = 0; i < 2; i += 1) {
    const email = `race-m${i}-${stamp}@example.com`;
    const invite = await request(`/api/tenants/${tenant.id}/memberships`, {
      method: 'POST',
      token: owner.token,
      body: {
        membershipPlanId: planId,
        method: 'CASH',
        customer: { name: `Race M${i}`, email },
      },
    });
    assert.equal(invite.status, 201, JSON.stringify(invite.body));
    cleanupUserIds.push(invite.body.membership.user.id);
    memberIds.push(invite.body.membership.user.id);
  }
  assert.equal(memberIds.length, 2);

  const date = addDays(zonedNow('Europe/Zagreb').date, 3);
  // Owner is bookable staff via TenantUser BUSINESS_OWNER — staffId required.
  const staffId = owner.user.id;
  const first = await request('/api/bookings', {
    method: 'POST',
    token: owner.token,
    body: {
      serviceId,
      staffId,
      date,
      startTime: '09:00',
      userId: memberIds[0],
    },
  });
  assert.equal(first.status, 201, JSON.stringify(first.body));

  // Overlapping 09:30–10:30 must be rejected once 09:00–10:00 occupies capacity 1.
  const second = await request('/api/bookings', {
    method: 'POST',
    token: owner.token,
    body: {
      serviceId,
      staffId,
      date,
      startTime: '09:30',
      userId: memberIds[1],
    },
  });
  assert.equal(second.status, 409, JSON.stringify(second.body));
  assert.ok(
    ['SLOT_UNAVAILABLE', 'STAFF_UNAVAILABLE', 'CAPACITY_FULL'].includes(second.body?.code),
    JSON.stringify(second.body),
  );

  const confirmed = await Booking.countDocuments({ tenantId: tenant.id, date, status: 'CONFIRMED' });
  assert.equal(confirmed, 1);
});

test('same trainer cannot overlap two different services', { timeout: 120000 }, async () => {
  const owner = await register('Staff Race Owner', `staff-race-owner-${stamp}@example.com`, 'BUSINESS_OWNER');
  const tenant = await openStudio(owner.token, `Staff Race ${stamp}`);

  // Existing CUSTOMER linked as studio staff must keep global role CUSTOMER.
  const pre = await register('Pre Staff', `pre-staff-${stamp}@example.com`, 'CUSTOMER');
  const staffRes = await request(`/api/tenants/${tenant.id}/staff`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: pre.user.name,
      email: pre.user.email,
      title: 'Trener',
    },
  });
  assert.equal(staffRes.status, 201, JSON.stringify(staffRes.body));
  const trainerId = staffRes.body.staff.id;
  const linked = await User.findById(pre.user.id);
  assert.equal(linked.role, 'CUSTOMER');

  const serviceA = await request(`/api/tenants/${tenant.id}/services`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: 'Service A',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 1,
      price: 0,
      membershipRequired: true,
    },
  });
  const serviceB = await request(`/api/tenants/${tenant.id}/services`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: 'Service B',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 1,
      price: 0,
      membershipRequired: true,
    },
  });
  assert.equal(serviceA.status, 201);
  assert.equal(serviceB.status, 201);

  const planRes = await request(`/api/tenants/${tenant.id}/membership-plans`, {
    method: 'POST',
    token: owner.token,
    body: {
      name: 'Staff Pack',
      price: 0,
      validityDays: 90,
      sessionsIncluded: 20,
      allowedServiceIds: [serviceA.body.service.id, serviceB.body.service.id],
    },
  });
  assert.equal(planRes.status, 201);
  const planId = planRes.body.plan.id;

  const memberIds = [];
  for (let i = 0; i < 2; i += 1) {
    const email = `staff-m${i}-${stamp}@example.com`;
    const invite = await request(`/api/tenants/${tenant.id}/memberships`, {
      method: 'POST',
      token: owner.token,
      body: {
        membershipPlanId: planId,
        method: 'CASH',
        customer: { name: `Staff M${i}`, email },
      },
    });
    assert.equal(invite.status, 201, JSON.stringify(invite.body));
    cleanupUserIds.push(invite.body.membership.user.id);
    memberIds.push(invite.body.membership.user.id);
  }

  const date = addDays(zonedNow('Europe/Zagreb').date, 4);
  const first = await request('/api/bookings', {
    method: 'POST',
    token: owner.token,
    body: {
      serviceId: serviceA.body.service.id,
      staffId: trainerId,
      date,
      startTime: '11:00',
      userId: memberIds[0],
    },
  });
  assert.equal(first.status, 201, JSON.stringify(first.body));

  const clash = await request('/api/bookings', {
    method: 'POST',
    token: owner.token,
    body: {
      serviceId: serviceB.body.service.id,
      staffId: trainerId,
      date,
      startTime: '11:00',
      userId: memberIds[1],
    },
  });
  assert.equal(clash.status, 409, JSON.stringify(clash.body));
  assert.equal(clash.body.code, 'STAFF_UNAVAILABLE');
});
