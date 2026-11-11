import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CONSENT_VERSION, hasValidConsent } from '../src/lib/consent.js';

describe('mobile consent', () => {
  test('exports current consent version', () => {
    assert.equal(CONSENT_VERSION, '2026-10-13');
  });

  test('accepts current privacyConsent on user', () => {
    assert.equal(hasValidConsent({
      privacyConsent: { isCurrent: true },
    }), true);
    assert.equal(hasValidConsent({
      privacyConsent: { isCurrent: false },
    }), false);
    assert.equal(hasValidConsent(null), false);
  });
});
