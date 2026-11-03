import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isOwnerRole,
  resolvePostLoginPath,
} from '../src/lib/resolvePostLoginPath.js';

test('isOwnerRole recognizes owner and platform roles', () => {
  assert.equal(isOwnerRole({ role: 'BUSINESS_OWNER' }), true);
  assert.equal(isOwnerRole({ role: 'CUSTOMER' }), false);
  assert.equal(isOwnerRole({ role: 'CUSTOMER', platformAdmin: true }), true);
  assert.equal(isOwnerRole(null), false);
});

test('resolvePostLoginPath sends owners to studio shell', () => {
  assert.equal(
    resolvePostLoginPath({ role: 'BUSINESS_OWNER' }, { guideDone: true }),
    '/stranica',
  );
  assert.equal(
    resolvePostLoginPath({ role: 'BUSINESS_OWNER' }, { guideDone: false }),
    '/postavljanje',
  );
});

test('resolvePostLoginPath sends members to /s/:slug via membership', () => {
  assert.equal(
    resolvePostLoginPath(
      { role: 'CUSTOMER' },
      {
        memberships: [
          { status: 'ACTIVE', tenant: { slug: 'demo-fitness' } },
        ],
      },
    ),
    '/s/demo-fitness',
  );
});

test('resolvePostLoginPath falls back to tenants/mine CUSTOMER row', () => {
  assert.equal(
    resolvePostLoginPath(
      { role: 'CUSTOMER' },
      {
        memberships: [],
        tenants: [{ role: 'CUSTOMER', tenant: { slug: 'yoga-zg' } }],
      },
    ),
    '/s/yoga-zg',
  );
});

test('resolvePostLoginPath sends platform staff to /admin', () => {
  assert.equal(resolvePostLoginPath({ role: 'ADMIN' }), '/admin');
  assert.equal(resolvePostLoginPath({ role: 'PLATFORM_STAFF' }), '/admin');
});
