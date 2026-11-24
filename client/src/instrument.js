import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { useEffect } from 'react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  const isProd = Boolean(import.meta.env.PROD);
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Avoid shipping emails/IPs/form PII to Sentry in production builds.
    sendDefaultPii: !isProd,
    integrations: [
      // React Router v7 tracing (better than plain browserTracing for this app)
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
      // Session replay only in non-prod by default (GDPR / first-customer hygiene).
      ...(isProd ? [] : [Sentry.replayIntegration()]),
    ],
    // 100% in local/dev so wizard verify is reliable; lower in production builds
    tracesSampleRate: isProd ? 0.2 : 1.0,
    tracePropagationTargets: [
      'localhost',
      /^https?:\/\/127\.0\.0\.1(?::\d+)?\/api/,
      /^https?:\/\/[^/]+\/api/,
    ],
    enableLogs: !isProd,
    replaysSessionSampleRate: isProd ? 0 : 1.0,
    replaysOnErrorSampleRate: isProd ? 0 : 1.0,
  });
}
