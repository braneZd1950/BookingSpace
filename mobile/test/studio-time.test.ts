import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CANCEL_WINDOW_OPTIONS,
  addDaysKey,
  formatCancellationWindow,
  hoursPayload,
  monthCells,
  sameDay,
  timeOptions,
  toDateKey,
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

test('toDateKey and addDaysKey stay calendar-local', () => {
  assert.equal(toDateKey(new Date(2026, 10, 3)), '2026-11-03');
  assert.equal(addDaysKey('2026-11-03', 1), '2026-11-04');
  assert.equal(addDaysKey('2026-11-01', -1), '2026-10-31');
});

test('sameDay compares calendar date only', () => {
  const morning = new Date(2026, 10, 3, 8, 0, 0);
  const evening = new Date(2026, 10, 3, 21, 15, 0);
  const next = new Date(2026, 10, 4, 8, 0, 0);
  assert.equal(sameDay(morning, evening), true);
  assert.equal(sameDay(morning, next), false);
});

test('timeOptions steps by 30 minutes across a day', () => {
  const options = timeOptions(30);
  assert.equal(options[0], '00:00');
  assert.equal(options[1], '00:30');
  assert.equal(options.at(-1), '23:30');
  assert.equal(options.length, 48);
});

test('monthCells pads Monday-first grid', () => {
  // November 2026 starts on Sunday → 6 leading nulls in Mon-first grid
  const cells = monthCells(2026, 10);
  assert.equal(cells[0], null);
  assert.equal(cells[5], null);
  assert.equal(cells[6]?.getDate(), 1);
  assert.ok(cells.every((cell) => cell === null || cell instanceof Date));
  assert.equal(cells.length % 7, 0);
});
