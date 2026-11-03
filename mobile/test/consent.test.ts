import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CONSENT_VERSION,
  consentFromUser,
  getAnonymousKey,
  hasValidConsent,
  hasValidLocalConsent,
  readLocalConsent,
  writeLocalConsent,
} from '../src/lib/consent';

test('CONSENT_VERSION is a dated string', () => {
  assert.match(CONSENT_VERSION, /^\d{4}-\d{2}-\d{2}$/);
});

test('consentFromUser maps DTO and marks current version', () => {
  const mapped = consentFromUser({
    privacyConsent: {
      accepted: true,
      version: CONSENT_VERSION,
      acceptedAt: '2026-10-13T10:00:00.000Z',
      source: 'mobile',
    },
  });
  assert.equal(mapped?.accepted, true);
  assert.equal(mapped?.version, CONSENT_VERSION);
  assert.equal(mapped?.isCurrent, true);
  assert.equal(consentFromUser(null), null);
});

test('hasValidConsent requires isCurrent on user payload', () => {
  assert.equal(hasValidConsent({ privacyConsent: { accepted: true, isCurrent: true } }), true);
  assert.equal(hasValidConsent({ privacyConsent: { accepted: true, isCurrent: false } }), false);
  assert.equal(hasValidConsent({}), false);
});

test('local consent round-trip and version gate', async () => {
  const memory = new Map<string, string>();
  const getItem = async (key: string) => memory.get(key) ?? null;
  const setItem = async (key: string, value: string) => {
    memory.set(key, value);
  };
  const deleteItem = async (key: string) => {
    memory.delete(key);
  };

  assert.equal(await hasValidLocalConsent(getItem), false);

  await writeLocalConsent(setItem, deleteItem, {
    accepted: true,
    version: CONSENT_VERSION,
    acceptedAt: '2026-11-03T12:00:00.000Z',
  });
  assert.equal(await hasValidLocalConsent(getItem), true);

  const stored = await readLocalConsent(getItem);
  assert.equal(stored?.version, CONSENT_VERSION);

  await writeLocalConsent(setItem, deleteItem, {
    accepted: true,
    version: '2099-01-01',
  });
  assert.equal(await hasValidLocalConsent(getItem), false);

  await writeLocalConsent(setItem, deleteItem, null);
  assert.equal(await readLocalConsent(getItem), null);
});

test('getAnonymousKey reuses stored value', async () => {
  const memory = new Map<string, string>();
  const getItem = async (key: string) => memory.get(key) ?? null;
  const setItem = async (key: string, value: string) => {
    memory.set(key, value);
  };

  const first = await getAnonymousKey(getItem, setItem);
  const second = await getAnonymousKey(getItem, setItem);
  assert.equal(first, second);
  assert.match(first, /^anon-/);
});
