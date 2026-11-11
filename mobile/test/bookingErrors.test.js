import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  messageForCancelBookingError,
  messageForCreateBookingError,
} from '../src/lib/bookingErrors.js';

describe('mobile bookingErrors', () => {
  test('maps create booking codes for members', () => {
    assert.equal(
      messageForCreateBookingError({ code: 'SLOT_UNAVAILABLE' }),
      'Taj sat više nije slobodan.',
    );
    assert.equal(
      messageForCreateBookingError({ code: 'NO_SESSIONS' }),
      'Nemate aktivnu članarinu ili preostale termine.',
    );
    assert.equal(
      messageForCreateBookingError({ code: 'BOOKING_CONFLICT' }),
      'Već imate rezervaciju u tom terminu.',
    );
    assert.equal(
      messageForCreateBookingError({ code: 'CONSENT_REQUIRED' }),
      'Potrebna je privola. Prihvatite je u Privatnost ili Postavke.',
    );
  });

  test('maps cancel window errors', () => {
    assert.equal(
      messageForCancelBookingError(
        { code: 'CANCELLATION_WINDOW' },
        { cancelWindowLabel: '1 sat prije početka' },
      ),
      'Prekasno je za otkaz. Rok je 1 sat prije početka.',
    );
  });
});
