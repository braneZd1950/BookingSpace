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

const created = {
  userIds: [],
  tenantId: null,
};

let server;
let baseUrl;

function authHeaders(token, json = false) {
  const headers = {};
  if (json) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body || token ? authHeaders(token, Boolean(body)) : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  if (text) payload = JSON.parse(text);
  return { status: response.status, body: payload };
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

test('MVP flow: business, membership, booking and cancellation', { timeout: 60000 }, async () => {
  const stamp = Date.now();
  const ownerEmail = `owner-${stamp}@example.com`;
  const customerEmail = `customer-${stamp}@example.com`;
  const password = 'test-pass-123';

  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);

  const owner = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Vlasnik Test',
      email: ownerEmail,
      password,
      role: 'BUSINESS_OWNER',
    },
  });
  assert.equal(owner.status, 201);
  created.userIds.push(owner.body.user.id);
  const ownerToken = owner.body.token;

  const emptyMine = await request('/api/tenants/mine', { token: ownerToken });
  assert.equal(emptyMine.status, 200);
  assert.deepEqual(emptyMine.body.tenants, []);

  const tenantResponse = await request('/api/tenants', {
    method: 'POST',
    token: ownerToken,
    body: { name: `Studio ${stamp}`, niche: 'fitness' },
  });
  assert.equal(tenantResponse.status, 201);
  const tenant = tenantResponse.body.tenant;
  created.tenantId = tenant.id;

  const mine = await request('/api/tenants/mine', { token: ownerToken });
  assert.equal(mine.status, 200);
  assert.equal(mine.body.tenants.length, 1);
  assert.equal(mine.body.tenants[0].role, 'BUSINESS_OWNER');
  assert.equal(mine.body.tenants[0].tenant.id, tenant.id);

  const hours = await request(`/api/tenants/${tenant.id}`, {
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
  assert.equal(hours.status, 200);

  const siteResponse = await request(`/api/tenants/${tenant.id}/site`, {
    method: 'PATCH',
    token: ownerToken,
    body: {
      template: 'fitness',
      layout: 'banner',
      paletteId: 'ember',
      theme: {
        primaryColor: '#b33b2e',
        secondaryColor: '#f3d5d0',
        fontFamily: 'Figtree, sans-serif',
        borderRadius: '0.5rem',
        buttonStyle: 'soft',
      },
      visibleSections: {
        hero: true,
        about: true,
        services: true,
        schedule: true,
        gallery: false,
        contact: true,
        location: true,
        openingHours: true,
      },
      seo: {
        title: tenant.name,
        description: 'Test studio stranica',
      },
    },
  });
  assert.equal(siteResponse.status, 200);
  assert.equal(siteResponse.body.tenant.siteSettings.layout, 'banner');
  assert.equal(siteResponse.body.tenant.siteSettings.paletteId, 'ember');
  assert.equal(siteResponse.body.tenant.theme.primaryColor, '#b33b2e');

  const profile = await request(`/api/tenants/${tenant.slug}/public`);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.tenant.name, tenant.name);
  assert.equal(profile.body.tenant.theme.primaryColor, '#b33b2e');
  assert.equal(profile.body.tenant.siteSettings.paletteId, 'ember');
  assert.equal(profile.body.tenant.siteSettings.visibleSections.gallery, false);
  assert.equal(profile.body.tenant.bookingSettings.workingHours.length, 7);

  const profilePatch = await request(`/api/tenants/${tenant.id}`, {
    method: 'PATCH',
    token: ownerToken,
    body: {
      description: 'Lokalni smoke opis',
      phone: '+385 91 000 0000',
      address: 'Test ulica 1',
    },
  });
  assert.equal(profilePatch.status, 200);

  const publicAfter = await request(`/api/tenants/${tenant.slug}/public`);
  assert.equal(publicAfter.body.tenant.description, 'Lokalni smoke opis');
  assert.equal(publicAfter.body.tenant.phone, '+385 91 000 0000');

  const serviceResponse = await request(`/api/tenants/${tenant.id}/services`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: 'Power Plate',
      durationMinutes: 30,
      slotIntervalMinutes: 15,
      capacity: 6,
      cancellationWindowMinutes: 15,
      price: 10,
      membershipRequired: true,
    },
  });
  assert.equal(serviceResponse.status, 201);
  const service = serviceResponse.body.service;

  const planResponse = await request(`/api/tenants/${tenant.id}/membership-plans`, {
    method: 'POST',
    token: ownerToken,
    body: {
      name: '12 treninga',
      price: 120,
      validityDays: 30,
      sessionsIncluded: 12,
      allowedServiceIds: [service.id],
    },
  });
  assert.equal(planResponse.status, 201);
  const plan = planResponse.body.plan;

  const customer = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Kupac Test',
      email: customerEmail,
      password,
      role: 'CUSTOMER',
    },
  });
  assert.equal(customer.status, 201);
  created.userIds.push(customer.body.user.id);
  const customerToken = customer.body.token;

  const membershipResponse = await request(`/api/tenants/${tenant.id}/memberships`, {
    method: 'POST',
    token: ownerToken,
    body: {
      userId: customer.body.user.id,
      membershipPlanId: plan.id,
      method: 'CASH',
      amount: 120,
    },
  });
  assert.equal(membershipResponse.status, 201);
  assert.equal(membershipResponse.body.membership.sessionsRemaining, 12);
  assert.match(membershipResponse.body.membership.code, /^MEM-\d{4}-\d{6}$/);
  assert.match(membershipResponse.body.paymentCode, /^PAY-\d{4}-\d{6}$/);

  const visitDate = addDays(zonedNow('Europe/Zagreb').date, 1);
  const before = await request(
    `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
  );
  assert.equal(before.status, 200);
  const openSlot = before.body.slots.find((slot) => slot.startTime === '10:00');
  assert.ok(openSlot);
  assert.equal(openSlot.available, 6);
  assert.equal(openSlot.status, 'AVAILABLE');

  const consent = await request('/api/consent', {
    method: 'POST',
    token: customerToken,
    body: {
      action: 'accept',
      version: '2026-10-13',
      source: 'register',
    },
  });
  assert.equal(consent.status, 200);
  assert.equal(consent.body.consent.isCurrent, true);

  const trainers = publicAfter.body.tenant.trainers || [];
  assert.ok(trainers.length > 0, 'owner should be bookable trainer');
  const staffId = trainers[0].id;

  const bookingBlocked = await request('/api/bookings', {
    method: 'POST',
    token: ownerToken,
    body: {
      serviceId: service.id,
      date: visitDate,
      startTime: '10:00',
      userId: customer.body.user.id,
      staffId,
    },
  });
  assert.equal(bookingBlocked.status, 403);
  assert.equal(bookingBlocked.body.code, 'CONSENT_REQUIRED');

  const ownerConsent = await request('/api/consent', {
    method: 'POST',
    token: ownerToken,
    body: {
      action: 'accept',
      version: '2026-10-13',
      source: 'settings',
    },
  });
  assert.equal(ownerConsent.status, 200);

  const bookingWithoutStaff = await request('/api/bookings', {
    method: 'POST',
    token: customerToken,
    body: {
      serviceId: service.id,
      date: visitDate,
      startTime: '10:00',
    },
  });
  assert.equal(bookingWithoutStaff.status, 400);
  assert.equal(bookingWithoutStaff.body.code, 'STAFF_REQUIRED');

  const bookingResponse = await request('/api/bookings', {
    method: 'POST',
    token: customerToken,
    body: {
      serviceId: service.id,
      date: visitDate,
      startTime: '10:00',
      staffId,
    },
  });
  assert.equal(bookingResponse.status, 201);
  assert.equal(bookingResponse.body.booking.status, 'CONFIRMED');
  assert.equal(String(bookingResponse.body.booking.staffId), String(staffId));

  const afterBook = await request(
    `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
  );
  const bookedSlot = afterBook.body.slots.find((slot) => slot.startTime === '10:00');
  assert.equal(bookedSlot.booked, 1);
  assert.equal(bookedSlot.available, 5);

  const myMemberships = await request('/api/memberships/my', { token: customerToken });
  assert.equal(myMemberships.body.memberships[0].sessionsUsed, 1);
  assert.equal(myMemberships.body.memberships[0].sessionsRemaining, 11);
  assert.equal(myMemberships.body.memberships[0].tenant.slug, tenant.slug);
  assert.equal(myMemberships.body.memberships[0].status, 'ACTIVE');

  const myBookings = await request('/api/bookings/my', { token: customerToken });
  assert.equal(myBookings.status, 200);
  assert.equal(myBookings.body.bookings[0].serviceName, 'Power Plate');
  assert.equal(myBookings.body.bookings[0].status, 'CONFIRMED');

  const cancelled = await request(`/api/bookings/${bookingResponse.body.booking.id}/cancel`, {
    method: 'PATCH',
    token: customerToken,
  });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.body.booking.status, 'CANCELLED');

  const afterCancel = await request(
    `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
  );
  const freedSlot = afterCancel.body.slots.find((slot) => slot.startTime === '10:00');
  assert.equal(freedSlot.booked, 0);
  assert.equal(freedSlot.available, 6);

  const restored = await request('/api/memberships/my', { token: customerToken });
  assert.equal(restored.body.memberships[0].sessionsUsed, 0);
  assert.equal(restored.body.memberships[0].sessionsRemaining, 12);
});
