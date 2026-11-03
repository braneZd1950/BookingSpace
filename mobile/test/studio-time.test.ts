import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CANCEL_WINDOW_OPTIONS,
  formatCancellationWindow,
  hoursPayload,
  withinCancellationWindow,
} from '../src/lib/studioTime';

test('formatCancellationWindow matches web HR copy', () => {
  assert.equal(formatCancellationWindow(60), '1 sat prije početka');
  assert.equal(formatCancellationWindow(90), '1 sat i 30 min prije početka');
});

test('CANCEL_WINDOW_OPTIONS covers 30m..12h step 30', () => {
  assert.equal(CANCEL_WINDOW_OPTIONS[0], 30);
  assert.equal(CANCEL_WINDOW_OPTIONS.at(-1), 12 * 60);
  assert.equal(CANCEL_WINDOW_OPTIONS.length, ((12 * 60 - 30) / 30) + 1);
});

test('hoursPayload closes Sunday when works=false', () => {
  const rows = hoursPayload({
    week: { works: true, from: '07:00', to: '21:00' },
    saturday: { works: true, from: '09:00', to: '13:00' },
    sunday: { works: false, from: '09:00', to: '13:00' },
    holidays: { works: false, from: '09:00', to: '13:00' },
  });
  assert.deepEqual(rows.find((row) => row.day === 0), { day: 0, closed: true });
});

test('withinCancellationWindow respects deadline', () => {
  assert.equal(
    withinCancellationWindow({ date: '2026-11-02', time: '09:00' }, '2026-11-02', '10:00', 60),
    true,
  );
  assert.equal(
    withinCancellationWindow({ date: '2026-11-02', time: '09:30' }, '2026-11-02', '10:00', 60),
    false,
  );
});
