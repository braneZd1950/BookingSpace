import { apiRequest } from './client';
import { CONSENT_VERSION } from '../lib/consent';

export async function recordConsent(body: {
  action: 'accept' | 'withdraw';
  version?: string;
  source?: string;
  path?: string;
  anonymousKey?: string;
}): Promise<{ ok?: boolean }> {
  return apiRequest<{ ok?: boolean }>('/consent', {
    method: 'POST',
    body: {
      action: body.action,
      version: body.version || CONSENT_VERSION,
      source: body.source || 'banner',
      path: body.path || '/mobile',
      anonymousKey: body.anonymousKey,
    },
    auth: true,
  });
}
