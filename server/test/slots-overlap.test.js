import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countBooked,
  decorateSlots,
  generateSlots,
} from '../src/modules/sessions/slots.js';

test('generateSlots steps by interval within open–close', () => {
  const slots = generateSlots({
    open: '09:00',
    close: '11:00',
    durationMinutes: 60,
    intervalMinutes: 30,
  });
  assert.deepEqual(slots.map((s) => s.startTime), ['09:00', '09:30', '10:00']);
  assert.equal(slots[0].endTime, '10:00');
  assert.equal(slots[1].endTime, '10:30');
});

test('PER_SLOT with equal duration/interval counts exact start only', () => {
  const slot = { startTime: '09:00', endTime: '10:00' };
  const bookings = [
    { status: 'CONFIRMED', startTime: '09:00', endTime: '10:00' },
    { status: 'CONFIRMED', startTime: '09:30', endTime: '10:30' },
    { status: 'CANCELLED', startTime: '09:00', endTime: '10:00' },
  ];
  assert.equal(
    countBooked(slot, bookings, 'PER_SLOT', { durationMinutes: 60, intervalMinutes: 60 }),
    1,
  );
});

test('PER_SLOT with interval < duration counts overlapping bookings', () => {
  const slot = { startTime: '09:30', endTime: '10:30' };
  const bookings = [
    { status: 'CONFIRMED', startTime: '09:00', endTime: '10:00' },
  ];
  assert.equal(
    countBooked(slot, bookings, 'PER_SLOT', { durationMinutes: 60, intervalMinutes: 30 }),
    1,
  );
});

test('CONCURRENT always uses overlap', () => {
  const slot = { startTime: '10:00', endTime: '11:00' };
  const bookings = [
    { status: 'CONFIRMED', startTime: '09:30', endTime: '10:30' },
  ];
  assert.equal(
    countBooked(slot, bookings, 'CONCURRENT', { durationMinutes: 60, intervalMinutes: 60 }),
    1,
  );
});

test('decorateSlots marks overlapping grid FULL at capacity 1', () => {
  const slots = generateSlots({
    open: '09:00',
    close: '11:00',
    durationMinutes: 60,
    intervalMinutes: 30,
  });
  const bookings = [
    { status: 'CONFIRMED', startTime: '09:00', endTime: '10:00' },
  ];
  const decorated = decorateSlots(
    slots,
    bookings,
    1,
    'PER_SLOT',
    { date: '2026-11-10', time: '08:00' },
    '2026-11-10',
    { durationMinutes: 60, intervalMinutes: 30 },
  );
  const byStart = Object.fromEntries(decorated.map((s) => [s.startTime, s.status]));
  assert.equal(byStart['09:00'], 'FULL');
  assert.equal(byStart['09:30'], 'FULL');
  assert.equal(byStart['10:00'], 'AVAILABLE');
});
