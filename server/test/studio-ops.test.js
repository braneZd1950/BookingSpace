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
const { default: OnlineWorkout } = await import('../src/models/OnlineWorkout.js');
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
    await OnlineWorkout.deleteMany({ tenantId });
    await Service.deleteMany({ tenantId });
    await TenantUser.deleteMany({ tenantId });
    await Tenant.deleteOne({ _id: tenantId });
  }
  if (created.userIds.length) {
    await User.deleteMany({ _id: { $in: created.userIds } });
  }
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

test('studio ops: login, invite member, trainer, booking with staff, suspend', { timeout: 90000 }, async () => {
  const stamp = Date.now();
  const password = 'StudioOps-123!';
  const ownerEmail = `ops-owner-${stamp}@example.com`;
  const memberEmail = `ops-member-${stamp}@example.com`;
  const trainerEmail = `ops-trainer-${stamp}@example.com`;

  const register = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Ops Owner',
      email: ownerEmail,
      password,
      role: 'BUSINESS_OWNER',
    },
  });
  assert.equal(register.status, 201);
  created.userIds.push(register.body.user.id);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: ownerEmail, password },
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  const ownerToken = login.body.token;
  await acceptConsent(ownerToken);

  const tenantRes = await request('/api/tenants', {
    method: 'POST',
    token: ownerToken,
    body: { name: `Ops Studio ${stamp}`, niche: 'fitness' },
  });
  assert.equal(tenantRes.status, 201);
  const tenant = tenantRes.body.tenant;
  created.tenantId = tenant.id;

  await request(`/api/tenants/${tenant.id}`, {
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

  const serviceRes = await request(`/api/tenants/${tenant.id}/services`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: 'Trening',
      durationMinutes: 60,
      slotIntervalMinutes: 60,
      capacity: 8,
      cancellationWindowMinutes: 60,
      price: 0,
      membershipRequired: true,
    },
  });
  assert.equal(serviceRes.status, 201);
  const service = serviceRes.body.service;

  const planRes = await request(`/api/tenants/${tenant.id}/membership-plans`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: '8 treninga',
      price: 80,
      validityDays: 30,
      sessionsIncluded: 8,
      allowedServiceIds: [service.id],
    },
  });
  assert.equal(planRes.status, 201);
  const plan = planRes.body.plan;

  const inviteMember = await request(`/api/tenants/${tenant.id}/memberships`, {
    method: 'POST',
    token: ownerToken,
    body: {
      customer: {
        name: 'Ana Ops',
        email: memberEmail,
        phone: '+38591111222',
      },
      membershipPlanId: plan.id,
      method: 'CASH',
    },
  });
  assert.equal(inviteMember.status, 201);
  assert.equal(inviteMember.body.accountCreated, true);
  assert.equal(inviteMember.body.membership.sessionsRemaining, 8);
  created.userIds.push(inviteMember.body.membership.user.id);
  const memberId = inviteMember.body.membership.user.id;

  const memberLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: memberEmail, password: 'wrong-password' },
  });
  assert.ok(memberLogin.status === 401 || memberLogin.status === 400);

  const trainerRes = await request(`/api/tenants/${tenant.id}/staff`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: 'Trener Ops',
      email: trainerEmail,
      title: 'Trener',
    },
  });
  assert.equal(trainerRes.status, 201);
  assert.equal(trainerRes.body.accountCreated, true);
  created.userIds.push(trainerRes.body.staff.id);
  const trainerId = trainerRes.body.staff.id;

  const staffList = await request(`/api/tenants/${tenant.id}/staff`, { token: ownerToken });
  assert.equal(staffList.status, 200);
  assert.ok(staffList.body.staff.length >= 2);
  assert.ok(staffList.body.staff.some((item) => item.id === trainerId && item.status === 'ACTIVE'));

  const publicProfile = await request(`/api/tenants/${tenant.slug}/public`);
  assert.equal(publicProfile.status, 200);
  assert.ok(Array.isArray(publicProfile.body.tenant.trainers));
  assert.ok(publicProfile.body.tenant.trainers.some((item) => item.id === trainerId));

  const members = await request(`/api/tenants/${tenant.id}/memberships`, { token: ownerToken });
  assert.equal(members.status, 200);
  assert.equal(members.body.memberships.length, 1);
  assert.equal(members.body.memberships[0].user.email, memberEmail);

  const visitDate = addDays(zonedNow('Europe/Zagreb').date, 1);
  const bookingNoStaff = await request('/api/bookings', {
    method: 'POST',
    token: ownerToken,
    body: {
      serviceId: service.id,
      date: visitDate,
      startTime: '10:00',
      userId: memberId,
    },
  });
  assert.equal(bookingNoStaff.status, 400);
  assert.equal(bookingNoStaff.body.code, 'STAFF_REQUIRED');

  const booking = await request('/api/bookings', {
    method: 'POST',
    token: ownerToken,
    body: {
      serviceId: service.id,
      date: visitDate,
      startTime: '10:00',
      userId: memberId,
      staffId: trainerId,
    },
  });
  assert.equal(booking.status, 201);
  assert.equal(booking.body.booking.status, 'CONFIRMED');
  assert.equal(String(booking.body.booking.staffId), String(trainerId));

  const dayBookings = await request(
    `/api/tenants/${tenant.id}/bookings?date=${visitDate}`,
    { token: ownerToken },
  );
  assert.equal(dayBookings.status, 200);
  assert.equal(dayBookings.body.bookings.length, 1);
  assert.equal(dayBookings.body.bookings[0].staff?.name, 'Trener Ops');

  const afterBook = await request(`/api/tenants/${tenant.id}/memberships`, { token: ownerToken });
  assert.equal(afterBook.body.memberships[0].sessionsUsed, 1);
  assert.equal(afterBook.body.memberships[0].sessionsRemaining, 7);

  const online = await request(`/api/tenants/${tenant.id}/online`, {
    method: 'POST',
    token: ownerToken,
    body: {
      title: 'Core 15',
      description: 'Test snimka',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      durationMinutes: 15,
      price: 9.99,
    },
  });
  assert.equal(online.status, 201);
  assert.equal(online.body.workout.title, 'Core 15');

  const catalog = await request(`/api/tenants/${tenant.id}/online/catalog`);
  assert.equal(catalog.status, 200);
  assert.equal(catalog.body.workouts.length, 1);
  assert.equal(catalog.body.workouts[0].locked, true);
  assert.equal(catalog.body.workouts[0].videoUrl, null);

  const suspend = await request(`/api/memberships/${inviteMember.body.membership.id}/suspend`, {
    method: 'PATCH',
    token: ownerToken,
  });
  assert.equal(suspend.status, 200);
  assert.equal(suspend.body.membership.status, 'SUSPENDED');

  const trainerOff = await request(`/api/tenants/${tenant.id}/staff/${trainerId}/suspend`, {
    method: 'PATCH',
    token: ownerToken,
  });
  assert.equal(trainerOff.status, 200);
  assert.equal(trainerOff.body.staff.status, 'SUSPENDED');
});
