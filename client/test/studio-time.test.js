import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatCancellationWindow,
  hoursPayload,
  toDateKey,
  withinCancellationWindow,
  zonedClock,
} from '../src/pages/owner/studioTime.js';

test('formatCancellationWindow labels minutes and hours in HR', () => {
  assert.equal(formatCancellationWindow(30), '30 min prije početka');
  assert.equal(formatCancellationWindow(60), '1 sat prije početka');
  assert.equal(formatCancellationWindow(120), '2 sata prije početka');
  assert.equal(formatCancellationWindow(0), 'do samog početka termina');
});

test('hoursPayload maps week/weekend rows for bookingSettings', () => {
  const payload = hoursPayload({
    week: { works: true, from: '07:00', to: '21:00' },
    saturday: { works: true, from: '09:00', to: '13:00' },
    sunday: { works: false, from: '09:00', to: '13:00' },
    holidays: { works: false, from: '09:00', to: '13:00' },
  });
  assert.equal(payload.length, 7);
  assert.deepEqual(payload.find((row) => row.day === 1), {
    day: 1,
    closed: false,
    open: '07:00',
    close: '21:00',
  });
  assert.deepEqual(payload.find((row) => row.day === 0), {
    day: 0,
    closed: true,
  });
});

test('withinCancellationWindow restores session before deadline', () => {
  const now = { date: '2026-11-02', time: '08:00' };
  assert.equal(withinCancellationWindow(now, '2026-11-02', '10:00', 60), true);
  assert.equal(withinCancellationWindow(now, '2026-11-02', '08:30', 60), false);
});

test('toDateKey and zonedClock stay stable shapes', () => {
  const key = toDateKey(new Date(2026, 10, 2));
  assert.equal(key, '2026-11-02');
  const clock = zonedClock('Europe/Zagreb');
  assert.match(clock.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(clock.time, /^\d{2}:\d{2}$/);
});
