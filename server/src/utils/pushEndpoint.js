import { HttpError } from './httpError.js';

/** Known Web Push service hosts — blocks SSRF via user-controlled endpoints. */
const PUSH_HOST_ALLOW = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
];

function isAllowedPushHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  if (host.includes(':')) return false; // IPv6 literals
  if (PUSH_HOST_ALLOW.includes(host)) return true;
  return (
    host.endsWith('.googleapis.com')
    || host.endsWith('.mozilla.com')
    || host.endsWith('.push.apple.com')
    || host.endsWith('.notify.windows.com')
  );
}

/** @returns {string} normalized https endpoint */
export function assertSafePushEndpoint(raw) {
  let url;
  try {
    url = new URL(String(raw || ''));
  } catch {
    throw new HttpError(400, 'Invalid push endpoint', { code: 'INVALID_PUSH_ENDPOINT' });
  }
  if (url.protocol !== 'https:') {
    throw new HttpError(400, 'Push endpoint must use HTTPS', { code: 'INVALID_PUSH_ENDPOINT' });
  }
  if (!isAllowedPushHost(url.hostname)) {
    throw new HttpError(400, 'Push endpoint host is not allowed', { code: 'INVALID_PUSH_ENDPOINT' });
  }
  return url.href;
}
