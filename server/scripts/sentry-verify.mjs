import '../src/config/env.js';
import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN?.trim();
if (!dsn) {
  console.error('SENTRY_DSN missing');
  process.exit(1);
}

Sentry.init({
  dsn,
  environment: process.env.NODE_ENV || 'development',
});

const msg = `Sentry agent verify ${Date.now()}`;
const eventId = Sentry.captureException(new Error(msg));
const flushed = await Sentry.flush(15000);
console.log(JSON.stringify({ msg, eventId, flushed }, null, 2));
process.exit(flushed && eventId ? 0 : 1);
