import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CONSENT_VERSION,
  acceptLocally,
  consentFromUser,
  hasValidConsent,
  hasValidLocalConsent,
  readLocalConsent,
  retainLocalConsentAfterLogout,
  withdrawLocally,
  writeLocalConsent,
} from '../src/lib/consent.js';

const store = new Map();

function installStorage() {
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
  };
  globalThis.window = {
    dispatchEvent: () => true,
  };
}

test('consent version and local accept/withdraw cycle', () => {
  store.clear();
  installStorage();

  assert.equal(CONSENT_VERSION, '2026-10-13');
  assert.equal(hasValidLocalConsent(), false);

  acceptLocally('banner');
  assert.equal(hasValidLocalConsent(), true);
  assert.equal(readLocalConsent()?.source, 'banner');
  assert.equal(readLocalConsent()?.version, CONSENT_VERSION);

  withdrawLocally('settings');
  assert.equal(hasValidLocalConsent(), false);
  assert.equal(readLocalConsent()?.accepted, false);
  assert.ok(readLocalConsent()?.withdrawnAt);
});

test('hasValidConsent prefers user privacyConsent.isCurrent', () => {
  store.clear();
  installStorage();
  writeLocalConsent({
    accepted: true,
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  });

  // Empty/default account + unbound local must not auto-accept another login.
  assert.equal(hasValidConsent({
    id: 'u1',
    privacyConsent: { isCurrent: false, accepted: false, version: '' },
  }), false);
  assert.equal(hasValidConsent({
    id: 'u1',
    privacyConsent: { isCurrent: true, accepted: true, version: CONSENT_VERSION },
  }), true);
});

test('hasValidConsent trusts device accept bound to the same account', () => {
  store.clear();
  installStorage();
  acceptLocally('banner', { userId: 'owner-1', allowAccountSync: false });

  assert.equal(hasValidConsent({
    id: 'owner-1',
    privacyConsent: { accepted: false, version: '', isCurrent: false },
  }), true);
  assert.equal(hasValidConsent({
    id: 'other-user',
    privacyConsent: { accepted: false, version: '', isCurrent: false },
  }), false);
});

test('hasValidConsent honors account withdraw over local accept', () => {
  store.clear();
  installStorage();
  acceptLocally('banner', { userId: 'owner-1' });

  assert.equal(hasValidConsent({
    id: 'owner-1',
    privacyConsent: {
      accepted: false,
      version: CONSENT_VERSION,
      withdrawnAt: '2026-01-01',
      isCurrent: false,
    },
  }), false);
});

test('guest allowAccountSync covers empty account until logout clears the flag', () => {
  store.clear();
  installStorage();
  acceptLocally('banner'); // allowAccountSync true
  assert.equal(hasValidConsent({
    id: 'fresh',
    privacyConsent: { accepted: false, version: '', isCurrent: false },
  }), true);

  retainLocalConsentAfterLogout();
  assert.equal(hasValidConsent({
    id: 'fresh',
    privacyConsent: { accepted: false, version: '', isCurrent: false },
  }), false);
});

test('consentFromUser normalizes payload', () => {
  const shaped = consentFromUser({
    privacyConsent: {
      accepted: true,
      version: CONSENT_VERSION,
      acceptedAt: '2026-01-01',
      source: 'settings',
    },
  });
  assert.equal(shaped.isCurrent, true);
  assert.equal(shaped.source, 'settings');
  assert.equal(consentFromUser({}), null);
});

test('logout keeps local accept but blocks account sync', () => {
  store.clear();
  installStorage();

  acceptLocally('banner');
  assert.equal(hasValidLocalConsent(), true);
  assert.equal(readLocalConsent()?.allowAccountSync, true);

  retainLocalConsentAfterLogout();
  assert.equal(hasValidLocalConsent(), true);
  assert.equal(readLocalConsent()?.allowAccountSync, false);
  assert.equal(hasValidConsent(null), true);
});
