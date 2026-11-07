import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, before, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
const { default: User } = await import('../src/models/User.js');
const { signAccessToken } = await import('../src/utils/token.js');
const { createPlatformStaff } = await import('../src/modules/platformStaff/service.js');

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
  await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
  await memory.stop();
});

test('promoting customer to platform staff bumps tokenVersion', async () => {
  const stamp = Date.now();
  const superAdmin = await User.create({
    name: 'Super',
    email: `super-${stamp}@example.com`,
    passwordHash: 'x',
    role: 'ADMIN',
    tokenVersion: 0,
  });
  const customer = await User.create({
    name: 'Soon Staff',
    email: `soon-staff-${stamp}@example.com`,
    passwordHash: 'x',
    role: 'CUSTOMER',
    tokenVersion: 0,
  });
  const oldToken = signAccessToken(customer);

  const meBefore = await request('/api/auth/me', { token: oldToken });
  assert.equal(meBefore.status, 200);

  await createPlatformStaff(superAdmin, {
    name: 'Soon Staff',
    email: customer.email,
    password: 'SecurePass1!',
  });

  const refreshed = await User.findById(customer._id);
  assert.equal(refreshed.role, 'PLATFORM_STAFF');
  assert.equal(Number(refreshed.tokenVersion), 1);

  const meAfter = await request('/api/auth/me', { token: oldToken });
  assert.equal(meAfter.status, 401);

  await User.deleteMany({ _id: { $in: [superAdmin._id, customer._id] } });
});
