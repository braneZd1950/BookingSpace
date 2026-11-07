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
const bootstrapEmail = `listed-${Date.now()}@example.com`;
process.env.ADMIN_EMAILS = bootstrapEmail;
process.env.ADMIN_EMAIL_BOOTSTRAP = 'false';

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/config/db.js');
const { default: User } = await import('../src/models/User.js');
const { signAccessToken } = await import('../src/utils/token.js');
const { assertImageBuffer } = await import('../src/utils/mediaMagic.js');

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

test('logout / password change bumps tokenVersion and rejects old JWT', async () => {
  const email = `sec-${Date.now()}@example.com`;
  const password = 'SecurePass1!';
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Sec User', email, password, role: 'CUSTOMER' },
  });
  assert.equal(reg.status, 201);
  const oldToken = reg.body.token;

  const meBefore = await request('/api/auth/me', { token: oldToken });
  assert.equal(meBefore.status, 200);

  const logout = await request('/api/auth/logout', { method: 'POST', token: oldToken });
  assert.equal(logout.status, 204);

  const meAfter = await request('/api/auth/me', { token: oldToken });
  assert.equal(meAfter.status, 401);

  await User.deleteOne({ email });
});

test('ADMIN_EMAILS bootstrap disabled does not grant platformAdmin', async () => {
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'No Admin',
      email: bootstrapEmail,
      password: 'SecurePass1!',
      role: 'CUSTOMER',
    },
  });
  assert.equal(reg.status, 201);

  const me = await request('/api/auth/me', { token: reg.body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.platformAdmin, false);

  await User.deleteOne({ email: bootstrapEmail });
});

test('local video static path is not publicly listed', async () => {
  const res = await fetch(`${baseUrl}/uploads/aaaaaaaaaaaaaaaaaaaaaaaa/video/deadbeefdeadbeefdeadbeef.mp4`);
  assert.equal(res.status, 404);
});

test('assertImageBuffer rejects mismatched magic bytes', () => {
  const fakeJpeg = Buffer.from('not-an-image');
  assert.throws(() => assertImageBuffer(fakeJpeg, 'image/jpeg'));
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  assert.doesNotThrow(() => assertImageBuffer(jpeg, 'image/jpeg'));
});

test('signAccessToken embeds token version', async () => {
  const user = await User.create({
    name: 'Tok',
    email: `tok-${Date.now()}@example.com`,
    passwordHash: 'x',
    role: 'CUSTOMER',
    tokenVersion: 3,
  });
  const token = signAccessToken(user);
  const parts = token.split('.');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  assert.equal(payload.v, 3);
  await User.deleteOne({ _id: user._id });
});

test('media playback JWT is rejected as a session Bearer token', async () => {
  const { signMediaAccessToken } = await import('../src/utils/mediaToken.js');
  const { verifyAccessToken } = await import('../src/utils/token.js');

  const user = await User.create({
    name: 'Media',
    email: `media-${Date.now()}@example.com`,
    passwordHash: 'x',
    role: 'CUSTOMER',
    tokenVersion: 0,
  });
  const media = signMediaAccessToken({
    userId: user._id,
    tenantId: user._id,
    workoutId: user._id,
  });
  assert.throws(() => verifyAccessToken(media), (err) => err?.status === 401);

  const me = await request('/api/auth/me', { token: media });
  assert.equal(me.status, 401);

  await User.deleteOne({ _id: user._id });
});
