/**
 * Ephemeral API for Playwright authenticated specs.
 * Uses MongoMemoryServer so CI/local e2e never touch Atlas.
 *
 *   node server/scripts/e2e-api.mjs
 */
import { randomBytes } from 'node:crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '4001';
process.env.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('base64url');
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://127.0.0.1:4173';
process.env.CLIENT_ORIGINS = process.env.CLIENT_ORIGINS
  || 'http://127.0.0.1:4173,http://127.0.0.1:5173,http://localhost:4173,http://localhost:5173';
process.env.SMTP_HOST = '';
process.env.SMTP_USER = '';
process.env.SMTP_PASS = '';
process.env.EMAIL_FROM = '';
process.env.SENTRY_DSN = '';

const memory = await MongoMemoryServer.create();
process.env.MONGO_URI = memory.getUri();

const { default: app } = await import('../src/app.js');
const { connectDb } = await import('../src/config/db.js');

await connectDb();
const port = Number(process.env.PORT);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`[e2e-api] listening on http://127.0.0.1:${port}`);
});

async function shutdown() {
  await new Promise((resolve) => server.close(resolve));
  await memory.stop();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
