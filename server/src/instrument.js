/**
 * Must load before the app via: node --import ./src/instrument.js …
 * Initializes Sentry when SENTRY_DSN is set; no-op otherwise (tests / local without Sentry).
 */
import './config/env.js';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  const isProd = process.env.NODE_ENV === 'production';
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: isProd ? 0.2 : 1.0,
    profileSessionSampleRate: isProd ? 0.2 : 1.0,
    profileLifecycle: 'trace',
    enableLogs: !isProd,
    // Keep emails / request PII out of production Sentry events for pilot customers.
    sendDefaultPii: !isProd,
  });
}
