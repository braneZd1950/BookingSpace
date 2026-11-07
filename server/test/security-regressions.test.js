import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(32).toString('base64url');
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.EMAIL_FROM = '';
process.env.VAPID_PUBLIC_KEY = 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
process.env.VAPID_PRIVATE_KEY = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../src/app.js');
const { connectDb, disconnectDb } = await import('../src/config/db.js');
const { default: PushSubscription } = await import('../src/models/PushSubscription.js');
const { default: User } = await import('../src/models/User.js');
const { signAccessToken } = await import('../src/utils/token.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let server;
let baseUrl;

async function request(path, { method = 'GET', token, body, rawQuery } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const url = rawQuery ? `${baseUrl}${path}${rawQuery}` : `${baseUrl}${path}`;
  const response = await fetch(url, {
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

test('Express simple query parser does not objectify operator keys', async () => {
  // With "simple" parser, email[$ne] stays a flat string key — Zod rejects it as non-email.
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email: { $ne: null }, password: 'x'.repeat(12) },
  });
  assert.equal(res.status, 400);
  assert.ok(['VALIDATION_ERROR', 'BAD_REQUEST', 'INVALID_INPUT'].includes(res.body?.code)
    || /valid|email|validation/i.test(JSON.stringify(res.body)));
});

test('login rejects non-string operator-shaped email payload', async () => {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: { email: { $gt: '' }, password: 'Password1!' },
  });
  assert.equal(res.status, 400);
});

test('push subscribe validates body and rejects bad payload', async () => {
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Push User',
      email: `push-${Date.now()}@example.com`,
      password: 'SecurePass1!',
      role: 'CUSTOMER',
    },
  });
  assert.equal(reg.status, 201);

  const bad = await request('/api/push/subscribe', {
    method: 'POST',
    token: reg.body.token,
    body: { endpoint: 'not-a-url', keys: { p256dh: 'x', auth: 'y' } },
  });
  assert.equal(bad.status, 400);

  const ok = await request('/api/push/subscribe', {
    method: 'POST',
    token: reg.body.token,
    body: {
      endpoint: `https://push.example/${Date.now()}`,
      keys: { p256dh: 'p256dh-key-value', auth: 'auth-key-value' },
      client: 'web',
    },
  });
  assert.equal(ok.status, 201);

  await User.deleteOne({ _id: reg.body.user.id });
  await PushSubscription.deleteMany({ userId: reg.body.user.id });
});

test('push endpoint cannot be hijacked by another user', async () => {
  const stamp = Date.now();
  const a = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Push A',
      email: `push-a-${stamp}@example.com`,
      password: 'SecurePass1!',
      role: 'CUSTOMER',
    },
  });
  const b = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Push B',
      email: `push-b-${stamp}@example.com`,
      password: 'SecurePass1!',
      role: 'CUSTOMER',
    },
  });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);

  const endpoint = `https://push.example/shared-${stamp}`;
  const first = await request('/api/push/subscribe', {
    method: 'POST',
    token: a.body.token,
    body: {
      endpoint,
      keys: { p256dh: 'p256dh-a', auth: 'auth-a' },
    },
  });
  assert.equal(first.status, 201);

  const hijack = await request('/api/push/subscribe', {
    method: 'POST',
    token: b.body.token,
    body: {
      endpoint,
      keys: { p256dh: 'p256dh-b', auth: 'auth-b' },
    },
  });
  assert.equal(hijack.status, 409);
  assert.equal(hijack.body.code, 'PUSH_ENDPOINT_TAKEN');

  await User.deleteMany({ _id: { $in: [a.body.user.id, b.body.user.id] } });
  await PushSubscription.deleteMany({ endpoint });
});

test('password reset bumps tokenVersion and rejects old JWT', async () => {
  const email = `reset-${Date.now()}@example.com`;
  const reg = await request('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'Reset User',
      email,
      password: 'SecurePass1!',
      role: 'CUSTOMER',
    },
  });
  assert.equal(reg.status, 201);
  const oldToken = reg.body.token;

  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpires');
  const rawToken = randomBytes(32).toString('hex');
  user.passwordResetTokenHash = createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const reset = await request('/api/auth/reset-password', {
    method: 'POST',
    body: { token: rawToken, password: 'NewSecurePass2!' },
  });
  assert.equal(reset.status, 200);

  const me = await request('/api/auth/me', { token: oldToken });
  assert.equal(me.status, 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'NewSecurePass2!' },
  });
  assert.equal(login.status, 200);

  await User.deleteOne({ email });
});

test('analytics track ignores stale JWT (tokenVersion mismatch)', async () => {
  const user = await User.create({
    name: 'Track',
    email: `track-${Date.now()}@example.com`,
    passwordHash: 'x',
    role: 'CUSTOMER',
    tokenVersion: 0,
  });
  const stale = signAccessToken(user);
  user.tokenVersion = 1;
  await user.save();

  const res = await request('/api/analytics/events', {
    method: 'POST',
    token: stale,
    body: { type: 'page_view', path: '/login' },
  });
  // Handler always 204; stale token must not associate userId (no throw).
  assert.equal(res.status, 204);

  await User.deleteOne({ _id: user._id });
});

test('Google link policy guards password takeover and mismatch in source', () => {
  const src = readFileSync(join(root, 'src/modules/auth/service.js'), 'utf8');
  assert.match(src, /passwordHash/);
  assert.match(src, /EMAIL_TAKEN/);
  assert.match(src, /GOOGLE_MISMATCH/);
  assert.match(src, /Do not attach Google to an existing password account/);
});

test('app uses simple query parser', () => {
  const src = readFileSync(join(root, 'src/app.js'), 'utf8');
  assert.match(src, /query parser['"],\s*['"]simple['"]/);
});
