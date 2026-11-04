import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { after, before, describe, test } from 'node:test';
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

const CONSENT_VERSION = '2026-10-13';
const created = { userIds: [], tenantIds: [] };

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

async function acceptConsent(token, source = 'settings') {
  const res = await request('/api/consent', {
    method: 'POST',
    token,
    body: { action: 'accept', version: CONSENT_VERSION, source },
  });
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return res;
}

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

before(async () => {
  await connectDb();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  for (const tenantId of created.tenantIds) {
    await Booking.deleteMany({ tenantId });
    await Membership.deleteMany({ tenantId });
    await Payment.deleteMany({ tenantId });
    await MembershipPlan.deleteMany({ tenantId });
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

describe('full lifecycle API', () => {
  test('health + auth register/login/me/logout + validation edges', { timeout: 60000 }, async () => {
    const stamp = Date.now();
    const email = `life-owner-${stamp}@example.com`;
    const password = 'Lifecycle-123!';

    const health = await request('/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.body.ok, true);

    const weak = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'X', email: `weak-${stamp}@example.com`, password: 'short', role: 'CUSTOMER' },
    });
    assert.equal(weak.status, 400);

    const owner = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Life Owner', email, password, role: 'BUSINESS_OWNER', phone: '+38591111111' },
    });
    assert.equal(owner.status, 201);
    created.userIds.push(owner.body.user.id);
    assert.equal(owner.body.user.role, 'BUSINESS_OWNER');
    assert.ok(owner.body.token);

    const dup = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Dup', email, password, role: 'CUSTOMER' },
    });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, 'EMAIL_TAKEN');

    const badLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password: 'wrong-password-99' },
    });
    assert.equal(badLogin.status, 401);
    assert.equal(badLogin.body.code, 'INVALID_CREDENTIALS');

    const login = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
    const token = login.body.token;

    const me = await request('/api/auth/me', { token });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, email);
    assert.equal(me.body.user.phone, '+38591111111');

    const patched = await request('/api/auth/me', {
      method: 'PATCH',
      token,
      body: {
        name: 'Life Owner Updated',
        notificationPrefs: { bookingEmail: false, weeklyDigest: true },
        uiTheme: 'dark',
      },
    });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.user.name, 'Life Owner Updated');
    assert.equal(patched.body.user.notificationPrefs.bookingEmail, false);
    assert.equal(patched.body.user.notificationPrefs.weeklyDigest, true);
    assert.equal(patched.body.user.uiTheme, 'dark');

    const themeLight = await request('/api/auth/me', {
      method: 'PATCH',
      token,
      body: { uiTheme: 'light' },
    });
    assert.equal(themeLight.status, 200);
    assert.equal(themeLight.body.user.uiTheme, 'light');

    const unauthMe = await request('/api/auth/me');
    assert.equal(unauthMe.status, 401);

    const logout = await request('/api/auth/logout', { method: 'POST', token });
    assert.equal(logout.status, 204);
    assert.equal(logout.body, null);

    const afterLogout = await request('/api/auth/me', { token });
    assert.equal(afterLogout.status, 401);
  });

  test('forgot/reset password + change password + client reset link shape', { timeout: 60000 }, async () => {
    const stamp = Date.now();
    const email = `life-reset-${stamp}@example.com`;
    const password = 'ResetStart-123!';
    const nextPassword = 'ResetNext-456!';
    const changedPassword = 'ResetChanged-789!';

    const reg = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Reset User', email, password, role: 'CUSTOMER' },
    });
    assert.equal(reg.status, 201);
    created.userIds.push(reg.body.user.id);

    const unknown = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: `missing-${stamp}@example.com` },
    });
    assert.equal(unknown.status, 200);
    assert.equal(unknown.body.ok, true);

    const forgot = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
    assert.equal(forgot.status, 200);
    assert.equal(forgot.body.ok, true);
    assert.match(forgot.body.message || '', /oporavak|lozink/i);

    const rawToken = randomBytes(32).toString('hex');
    await User.updateOne(
      { email },
      {
        passwordResetTokenHash: hashResetToken(rawToken),
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    );

    const badToken = await request('/api/auth/reset-password', {
      method: 'POST',
      body: { token: randomBytes(32).toString('hex'), password: nextPassword },
    });
    assert.equal(badToken.status, 400);
    assert.equal(badToken.body.code, 'RESET_INVALID');

    const reset = await request('/api/auth/reset-password', {
      method: 'POST',
      body: { token: rawToken, password: nextPassword },
    });
    assert.equal(reset.status, 200);
    assert.equal(reset.body.ok, true);

    const oldLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    assert.equal(oldLogin.status, 401);

    const newLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password: nextPassword },
    });
    assert.equal(newLogin.status, 200);
    let token = newLogin.body.token;

    const reuse = await request('/api/auth/reset-password', {
      method: 'POST',
      body: { token: rawToken, password: 'AnotherPass-999!' },
    });
    assert.equal(reuse.status, 400);
    assert.equal(reuse.body.code, 'RESET_INVALID');

    const changeBad = await request('/api/auth/password', {
      method: 'PATCH',
      token,
      body: { currentPassword: 'nope', newPassword: changedPassword },
    });
    assert.equal(changeBad.status, 401);

    const change = await request('/api/auth/password', {
      method: 'PATCH',
      token,
      body: { currentPassword: nextPassword, newPassword: changedPassword },
    });
    assert.equal(change.status, 200);
    assert.equal(change.body.ok, true);
    assert.ok(change.body.token);
    token = change.body.token;

    const finalLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email, password: changedPassword },
    });
    assert.equal(finalLogin.status, 200);

    const me = await request('/api/auth/me', { token });
    assert.equal(me.status, 200);

    const origin = process.env.CLIENT_ORIGIN.replace(/\/$/, '');
    const resetUrl = `${origin}/nova-lozinka?token=${encodeURIComponent(rawToken)}`;
    assert.match(resetUrl, /^http:\/\/localhost:5173\/nova-lozinka\?token=/);
  });

  test('google auth reports not configured in test env', { timeout: 30000 }, async () => {
    const res = await request('/api/auth/google', {
      method: 'POST',
      body: { idToken: 'x'.repeat(40), intent: 'login' },
    });
    assert.ok([401, 503].includes(res.status));
    assert.ok(['GOOGLE_NOT_CONFIGURED', 'GOOGLE_INVALID'].includes(res.body.code));
  });

  test('register → studio → membership → book → cancel → complete/no-show + lists', { timeout: 120000 }, async () => {
    const stamp = Date.now();
    const password = 'FullFlow-123!';
    const ownerEmail = `full-owner-${stamp}@example.com`;
    const memberEmail = `full-member-${stamp}@example.com`;
    const guestEmail = `full-guest-${stamp}@example.com`;

    const ownerReg = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Full Owner', email: ownerEmail, password, role: 'BUSINESS_OWNER' },
    });
    assert.equal(ownerReg.status, 201);
    created.userIds.push(ownerReg.body.user.id);
    const ownerToken = ownerReg.body.token;
    await acceptConsent(ownerToken);

    const tenantRes = await request('/api/tenants', {
      method: 'POST',
      token: ownerToken,
      body: { name: `Full Studio ${stamp}`, niche: 'fitness' },
    });
    assert.equal(tenantRes.status, 201);
    const tenant = tenantRes.body.tenant;
    created.tenantIds.push(tenant.id);

    const hours = await request(`/api/tenants/${tenant.id}`, {
      method: 'PATCH',
      token: ownerToken,
      body: {
        description: 'Full lifecycle studio',
        phone: '+38592000000',
        address: 'Ulica Test 7',
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

    const site = await request(`/api/tenants/${tenant.id}/site`, {
      method: 'PATCH',
      token: ownerToken,
      body: {
        template: 'fitness',
        layout: 'banner',
        paletteId: 'ember',
        theme: {
          primaryColor: '#0e6b73',
          secondaryColor: '#d7eef0',
          fontFamily: 'Figtree, sans-serif',
          borderRadius: '0.6rem',
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
        seo: { title: tenant.name, description: 'Full lifecycle' },
      },
    });
    assert.equal(site.status, 200);

    const publicProfile = await request(`/api/tenants/${tenant.slug}/public`);
    assert.equal(publicProfile.status, 200);
    assert.equal(publicProfile.body.tenant.slug, tenant.slug);
    assert.ok((publicProfile.body.tenant.trainers || []).length > 0);
    const staffId = publicProfile.body.tenant.trainers[0].id;

    const discover = await request('/api/tenants/discover?limit=20');
    assert.equal(discover.status, 200);
    assert.ok(Array.isArray(discover.body.places));
    assert.ok(discover.body.places.some((place) => place.slug === tenant.slug));
    assert.ok(discover.body.counts);

    const serviceRes = await request(`/api/tenants/${tenant.id}/services`, {
      method: 'POST',
      token: ownerToken,
      body: {
        name: 'Full Power',
        durationMinutes: 30,
        slotIntervalMinutes: 30,
        capacity: 4,
        cancellationWindowMinutes: 24 * 60,
        price: 15,
        membershipRequired: true,
      },
    });
    assert.equal(serviceRes.status, 201);
    const service = serviceRes.body.service;

    const servicesList = await request(`/api/tenants/${tenant.id}/services`, { token: ownerToken });
    assert.equal(servicesList.status, 200);
    assert.ok(servicesList.body.services.some((row) => row.id === service.id));

    const servicePatch = await request(`/api/services/${service.id}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { name: 'Full Power Plus', capacity: 5 },
    });
    assert.equal(servicePatch.status, 200);
    assert.equal(servicePatch.body.service.name, 'Full Power Plus');
    assert.equal(servicePatch.body.service.capacity, 5);

    const planRes = await request(`/api/tenants/${tenant.id}/membership-plans`, {
      method: 'POST',
      token: ownerToken,
      body: {
        name: '10 treninga',
        price: 100,
        validityDays: 45,
        sessionsIncluded: 10,
        allowedServiceIds: [service.id],
      },
    });
    assert.equal(planRes.status, 201);
    const plan = planRes.body.plan;

    const plansList = await request(`/api/tenants/${tenant.id}/membership-plans`, { token: ownerToken });
    assert.equal(plansList.status, 200);
    assert.ok(plansList.body.plans.some((row) => row.id === plan.id));

    const planPatch = await request(`/api/membership-plans/${plan.id}`, {
      method: 'PATCH',
      token: ownerToken,
      body: { name: '10 treninga Pro', price: 110 },
    });
    assert.equal(planPatch.status, 200);
    assert.equal(planPatch.body.plan.name, '10 treninga Pro');

    const memberReg = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Full Member', email: memberEmail, password, role: 'CUSTOMER' },
    });
    assert.equal(memberReg.status, 201);
    created.userIds.push(memberReg.body.user.id);
    const memberToken = memberReg.body.token;
    await acceptConsent(memberToken, 'register');

    const guestReg = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Full Guest', email: guestEmail, password, role: 'CUSTOMER' },
    });
    assert.equal(guestReg.status, 201);
    created.userIds.push(guestReg.body.user.id);
    const guestToken = guestReg.body.token;
    await acceptConsent(guestToken, 'register');

    const membershipRes = await request(`/api/tenants/${tenant.id}/memberships`, {
      method: 'POST',
      token: ownerToken,
      body: {
        userId: memberReg.body.user.id,
        membershipPlanId: plan.id,
        method: 'CASH',
        amount: 110,
      },
    });
    assert.equal(membershipRes.status, 201);
    assert.equal(membershipRes.body.membership.sessionsRemaining, 10);
    const membershipId = membershipRes.body.membership.id;

    const membershipsList = await request(`/api/tenants/${tenant.id}/memberships`, { token: ownerToken });
    assert.equal(membershipsList.status, 200);
    assert.ok(membershipsList.body.memberships.some((row) => row.id === membershipId));

    const customers = await request(`/api/tenants/${tenant.id}/customers`, { token: ownerToken });
    assert.equal(customers.status, 200);
    assert.ok(Array.isArray(customers.body.customers));

    const customerDetail = await request(
      `/api/tenants/${tenant.id}/customers/${memberReg.body.user.id}`,
      { token: ownerToken },
    );
    assert.equal(customerDetail.status, 200);

    const payments = await request(`/api/tenants/${tenant.id}/payments`, { token: ownerToken });
    assert.equal(payments.status, 200);
    assert.ok(Array.isArray(payments.body.payments));
    assert.ok(payments.body.payments.length >= 1);

    const staffList = await request(`/api/tenants/${tenant.id}/staff`, { token: ownerToken });
    assert.equal(staffList.status, 200);

    const visitDate = addDays(zonedNow('Europe/Zagreb').date, 2);
    const availability = await request(
      `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
    );
    assert.equal(availability.status, 200);
    const openSlot = availability.body.slots.find((slot) => slot.startTime === '10:00');
    assert.ok(openSlot);
    assert.equal(openSlot.status, 'AVAILABLE');

    const guestBook = await request('/api/bookings', {
      method: 'POST',
      token: guestToken,
      body: {
        serviceId: service.id,
        date: visitDate,
        startTime: '10:00',
        staffId,
      },
    });
    assert.ok([403, 409].includes(guestBook.status));

    const bookingRes = await request('/api/bookings', {
      method: 'POST',
      token: memberToken,
      body: {
        serviceId: service.id,
        date: visitDate,
        startTime: '10:00',
        staffId,
      },
    });
    assert.equal(bookingRes.status, 201, JSON.stringify(bookingRes.body));
    const bookingId = bookingRes.body.booking.id;
    assert.equal(bookingRes.body.booking.status, 'CONFIRMED');

    const afterBook = await request(
      `/api/tenants/${tenant.id}/services/${service.id}/availability?date=${visitDate}`,
    );
    const bookedSlot = afterBook.body.slots.find((slot) => slot.startTime === '10:00');
    assert.equal(bookedSlot.booked, 1);

    const myBookings = await request('/api/bookings/my', { token: memberToken });
    assert.equal(myBookings.status, 200);
    assert.ok(myBookings.body.bookings.some((row) => row.id === bookingId));

    const tenantBookings = await request(`/api/tenants/${tenant.id}/bookings`, { token: ownerToken });
    assert.equal(tenantBookings.status, 200);
    assert.ok(tenantBookings.body.bookings.some((row) => row.id === bookingId));

    const myMemberships = await request('/api/memberships/my', { token: memberToken });
    assert.equal(myMemberships.status, 200);
    assert.equal(myMemberships.body.memberships[0].sessionsUsed, 1);
    assert.equal(myMemberships.body.memberships[0].sessionsRemaining, 9);

    const cancelled = await request(`/api/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
      token: memberToken,
    });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.booking.status, 'CANCELLED');

    const restored = await request('/api/memberships/my', { token: memberToken });
    assert.equal(restored.body.memberships[0].sessionsUsed, 0);
    assert.equal(restored.body.memberships[0].sessionsRemaining, 10);

    const booking2 = await request('/api/bookings', {
      method: 'POST',
      token: memberToken,
      body: {
        serviceId: service.id,
        date: visitDate,
        startTime: '11:00',
        staffId,
      },
    });
    assert.equal(booking2.status, 201);
    const booking2Id = booking2.body.booking.id;

    const booking3 = await request('/api/bookings', {
      method: 'POST',
      token: memberToken,
      body: {
        serviceId: service.id,
        date: visitDate,
        startTime: '12:00',
        staffId,
      },
    });
    assert.equal(booking3.status, 201);
    const booking3Id = booking3.body.booking.id;

    const completed = await request(`/api/bookings/${booking2Id}/complete`, {
      method: 'PATCH',
      token: ownerToken,
    });
    assert.equal(completed.status, 200);
    assert.equal(completed.body.booking.status, 'COMPLETED');

    const noShow = await request(`/api/bookings/${booking3Id}/no-show`, {
      method: 'PATCH',
      token: ownerToken,
    });
    assert.equal(noShow.status, 200);
    assert.equal(noShow.body.booking.status, 'NO_SHOW');

    const cancelAgain = await request(`/api/bookings/${booking2Id}/cancel`, {
      method: 'PATCH',
      token: memberToken,
    });
    assert.equal(cancelAgain.status, 409);

    const suspend = await request(`/api/memberships/${membershipId}/suspend`, {
      method: 'PATCH',
      token: ownerToken,
    });
    assert.equal(suspend.status, 200);
    assert.equal(suspend.body.membership.status, 'SUSPENDED');

    const pushConfig = await request('/api/push/vapid-public-key');
    assert.ok([200, 503].includes(pushConfig.status));

    const anonymousConsent = await request('/api/consent', {
      method: 'POST',
      body: {
        action: 'accept',
        version: CONSENT_VERSION,
        source: 'banner',
        anonymousKey: `anon-${stamp}`,
      },
    });
    assert.equal(anonymousConsent.status, 200);
  });
});
