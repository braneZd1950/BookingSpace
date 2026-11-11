import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { hoursLine, MEMBER_FAQS } from '../src/features/member/memberContent.js';

describe('mobile memberContent', () => {
  test('exposes FAQ copy', () => {
    assert.ok(MEMBER_FAQS.length >= 5);
    assert.ok(MEMBER_FAQS.every((item) => item.q && item.a));
  });

  test('formats hours lines', () => {
    assert.equal(hoursLine('Subota', { works: true, from: '09:00', to: '13:00' }), 'Subota: 09:00–13:00');
    assert.equal(hoursLine('Nedjelja', { works: false, from: '09:00', to: '13:00' }), 'Nedjelja: zatvoreno');
    assert.equal(hoursLine('Blagdani', null), 'Blagdani: zatvoreno');
  });
});
