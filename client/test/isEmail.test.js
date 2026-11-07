import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isEmail } from '../src/lib/isEmail.js';

test('isEmail accepts common shapes', () => {
  assert.equal(isEmail('a@b.co'), true);
  assert.equal(isEmail('user.name+tag@example.com'), true);
  assert.equal(isEmail('  trim@example.com  '), true);
});

test('isEmail rejects invalid shapes', () => {
  assert.equal(isEmail(''), false);
  assert.equal(isEmail('no-at'), false);
  assert.equal(isEmail('@nodomain.com'), false);
  assert.equal(isEmail('a@b'), false);
  assert.equal(isEmail('a@b.'), false);
  assert.equal(isEmail('.a@b.com'), false);
  assert.equal(isEmail('a.@b.com'), false);
  assert.equal(isEmail('a..b@c.com'), false);
  assert.equal(isEmail('a@b..com'), false);
  assert.equal(isEmail('a@-b.com'), false);
  assert.equal(isEmail('a@b.com-'), false);
  assert.equal(isEmail('a@b c.com'), false);
  assert.equal(isEmail(`${'x'.repeat(65)}@ex.com`), false);
});
