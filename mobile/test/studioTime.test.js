import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  dayOpen,
  formatCancellationWindow,
  hoursFromWorking,
  toDateKey,
  withinCancellationWindow,
} from '../src/features/studio/studioTime.js';

describe('mobile studioTime', () => {
  test('formats date keys and open days', () => {
    const date = new Date(2026, 10, 11); // Wed
    assert.equal(toDateKey(date), '2026-11-11');
    assert.equal(dayOpen([{ day: 3, closed: false, open: '08:00', close: '20:00' }], date), true);
    assert.equal(dayOpen([{ day: 3, closed: true }], date), false);
  });

  test('maps working hours and cancellation window', () => {
    const hours = hoursFromWorking([
      { day: 1, closed: false, open: '08:00', close: '20:00' },
      { day: 0, closed: true },
    ]);
    assert.equal(hours.week.works, true);
    assert.equal(hours.week.from, '08:00');
    assert.equal(hours.sunday.works, false);
    assert.equal(formatCancellationWindow(60), '1 sat prije početka');
  });

  test('checks cancellation window against zoned clock', () => {
    assert.equal(
      withinCancellationWindow({ date: '2026-11-11', time: '09:00' }, '2026-11-11', '10:00', 60),
      true,
    );
    assert.equal(
      withinCancellationWindow({ date: '2026-11-11', time: '09:30' }, '2026-11-11', '10:00', 60),
      false,
    );
  });
});
