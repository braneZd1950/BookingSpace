import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isOwnerRole,
  resolveHomeHrefFromContext,
} from '../src/features/auth/homeRouting';

test('isOwnerRole matches owner and platform accounts', () => {
  assert.equal(isOwnerRole({ id: '1', email: 'a@b.c', role: 'BUSINESS_OWNER' }), true);
  assert.equal(isOwnerRole({ id: '1', email: 'a@b.c', role: 'CUSTOMER' }), false);
  assert.equal(isOwnerRole({ id: '1', email: 'a@b.c', role: 'CUSTOMER', platformAdmin: true }), true);
  assert.equal(isOwnerRole(null), false);
});

test('resolveHomeHrefFromContext sends owners to /(app)', () => {
  assert.equal(
    resolveHomeHrefFromContext({ id: '1', email: 'ana@demo.hr', role: 'BUSINESS_OWNER' }),
    '/(app)',
  );
});

test('resolveHomeHrefFromContext sends members to /(member)/:slug via memberships', () => {
  assert.equal(
    resolveHomeHrefFromContext(
      { id: '2', email: 'ivan@demo.hr', role: 'CUSTOMER' },
      {
        memberships: [
          { status: 'ACTIVE', tenant: { slug: 'demo-fitness' } },
        ],
      },
    ),
    '/(member)/demo-fitness',
  );
});

test('resolveHomeHrefFromContext falls back to tenants/mine CUSTOMER', () => {
  assert.equal(
    resolveHomeHrefFromContext(
      { id: '2', email: 'ivan@demo.hr', role: 'CUSTOMER' },
      {
        memberships: [],
        tenants: [{ role: 'CUSTOMER', tenant: { slug: 'yoga-zg' } }],
      },
    ),
    '/(member)/yoga-zg',
  );
});

test('resolveHomeHrefFromContext without user goes to login', () => {
  assert.equal(resolveHomeHrefFromContext(null), '/(auth)/login');
});

test('resolveHomeHrefFromContext without membership goes to login (no empty member shell)', () => {
  assert.equal(
    resolveHomeHrefFromContext(
      { id: '2', email: 'ivan@demo.hr', role: 'CUSTOMER' },
      { memberships: [], tenants: [] },
    ),
    '/(auth)/login',
  );
});
