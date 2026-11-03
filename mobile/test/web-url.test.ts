import assert from 'node:assert/strict';
import { test } from 'node:test';
import { joinWebUrl } from '../src/lib/webUrl';

test('joinWebUrl normalizes origin slash and path', () => {
  assert.equal(joinWebUrl('https://anyminutes.hr', '/o-nama'), 'https://anyminutes.hr/o-nama');
  assert.equal(joinWebUrl('https://anyminutes.hr/', 'register'), 'https://anyminutes.hr/register');
  assert.equal(joinWebUrl('http://127.0.0.1:5173/', '/login'), 'http://127.0.0.1:5173/login');
});
