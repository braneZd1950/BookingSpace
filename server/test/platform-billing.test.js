import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(32).toString('base64url');
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const stamp = Date.now();
const adminEmail = `admin-${stamp}@example.com`;
process.env.ADMIN_EMAILS = adminEmail;

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/config/db.js');
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

before(async () => {
  await connectDb();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (created.tenantId) {
    await TenantUser.deleteMany({ tenantId: created.tenantId });
    await Tenant.deleteOne({ _id: created.tenantId });
  }
  if (created.userIds.length) {
    await User.deleteMany({ _id: { $in: created.userIds } });
  }
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

test('platform billing: trial, mark paid, warn/invoice gated by mail', { timeout: 60000 }, async () => {
  const password = 'test-pass-123';

  const owner = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Owner Billing',
      email: `owner-bill-${stamp}@example.com`,
      password,
      role: 'BUSINESS_OWNER',
    },
  });
  assert.equal(owner.status, 201);
  created.userIds.push(owner.body.user.id);

  const tenantRes = await request('/api/tenants', {
    method: 'POST',
    token: owner.body.token,
    body: {
      name: `Billing Studio ${stamp}`,
      niche: 'fitness',
      email: `studio-bill-${stamp}@example.com`,
    },
  });
  assert.equal(tenantRes.status, 201);
  created.tenantId = tenantRes.body.tenant.id;
  assert.equal(tenantRes.body.tenant.billing?.status || 'TRIAL', 'TRIAL');

  const stranger = await request('/api/analytics/platform/billing', {
    token: owner.body.token,
  });
  assert.equal(stranger.status, 403);

  const admin = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Platform Admin',
      email: adminEmail,
      password,
      role: 'CUSTOMER',
    },
  });
  assert.equal(admin.status, 201);
  created.userIds.push(admin.body.user.id);

  const me = await request('/api/auth/me', { token: admin.body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.platformAdmin, true);

  const billing = await request('/api/analytics/platform/billing', {
    token: admin.body.token,
  });
  assert.equal(billing.status, 200);
  assert.ok(billing.body.summary.total >= 1);
  const row = billing.body.studios.find((item) => item.id === created.tenantId);
  assert.ok(row);
  assert.equal(row.bucket, 'trial');
  assert.ok(row.validUntil);

  const paid = await request(`/api/analytics/platform/billing/${created.tenantId}`, {
    method: 'PATCH',
    token: admin.body.token,
    body: { markPaid: true, amount: 49, plan: 'standard' },
  });
  assert.equal(paid.status, 200);
  assert.equal(paid.body.studio.status, 'PAID');
  assert.equal(paid.body.studio.bucket, 'paid');
  assert.equal(paid.body.studio.amount, 49);

  const unpaid = await request(`/api/analytics/platform/billing/${created.tenantId}`, {
    method: 'PATCH',
    token: admin.body.token,
    body: { status: 'UNPAID' },
  });
  assert.equal(unpaid.status, 200);
  assert.equal(unpaid.body.studio.bucket, 'unpaid');

  const warn = await request(`/api/analytics/platform/billing/${created.tenantId}/warn`, {
    method: 'POST',
    token: admin.body.token,
  });
  // Route + auth OK; 200 if SMTP works, otherwise mail layer error (env-dependent).
  assert.ok([200, 400, 500, 503].includes(warn.status), `unexpected warn status ${warn.status}`);
  assert.notEqual(warn.status, 401);
  assert.notEqual(warn.status, 403);
  assert.notEqual(warn.status, 404);

  const invoice = await request(`/api/analytics/platform/billing/${created.tenantId}/invoice`, {
    method: 'POST',
    token: admin.body.token,
  });
  assert.ok([200, 400, 500, 503].includes(invoice.status), `unexpected invoice status ${invoice.status}`);
  assert.notEqual(invoice.status, 403);

  const studios = await request('/api/analytics/platform/studios?days=30', {
    token: admin.body.token,
  });
  assert.equal(studios.status, 200);
  assert.ok(Array.isArray(studios.body.studios));

  const system = await request('/api/analytics/platform/system', {
    token: admin.body.token,
  });
  assert.equal(system.status, 200);
});
