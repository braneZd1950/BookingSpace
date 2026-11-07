import { fromMinutes, overlaps, toMinutes, weekdayIndex } from '../../utils/time.js';

export function isBlocked(date, periods = []) {
  return periods.some((period) => date >= period.startDate && date <= period.endDate);
}

export function hoursForDate(workingHours = [], date) {
  const day = weekdayIndex(date);
  return workingHours.find((item) => item.day === day && !item.closed && item.open && item.close) || null;
}

export function generateSlots({ open, close, durationMinutes, intervalMinutes }) {
  const openMinutes = toMinutes(open);
  const closeMinutes = toMinutes(close);
  const slots = [];

  for (
    let cursor = openMinutes;
    cursor + durationMinutes <= closeMinutes;
    cursor += intervalMinutes
  ) {
    slots.push({
      startTime: fromMinutes(cursor),
      endTime: fromMinutes(cursor + durationMinutes),
    });
  }

  return slots;
}

/**
 * PER_SLOT normally counts exact start times (group classes).
 * When the grid interval is shorter than duration, slots overlap — count by
 * overlap so capacity-1 cannot double-book 09:00–10:00 and 09:30–10:30.
 */
export function countBooked(slot, bookings, capacityModel, { durationMinutes, intervalMinutes } = {}) {
  const useOverlap = capacityModel === 'CONCURRENT'
    || (Number(intervalMinutes) > 0
      && Number(durationMinutes) > 0
      && Number(intervalMinutes) < Number(durationMinutes));
  return bookings.filter((booking) => {
    if (booking.status !== 'CONFIRMED') return false;
    if (useOverlap) {
      return overlaps(slot.startTime, slot.endTime, booking.startTime, booking.endTime);
    }
    return booking.startTime === slot.startTime;
  }).length;
}

export function decorateSlots(slots, bookings, capacity, capacityModel, now, date, timing = {}) {
  return slots.map((slot) => {
    const booked = countBooked(slot, bookings, capacityModel, timing);
    const past = date < now.date || (date === now.date && slot.startTime <= now.time);
    const full = booked >= capacity;
    let status = 'AVAILABLE';
    if (past) status = 'PAST';
    else if (full) status = 'FULL';

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity,
      booked,
      available: status === 'AVAILABLE' ? capacity - booked : 0,
      status,
    };
  });
}

export function buildDaySlots({
  workingHours,
  blockedPeriods,
  durationMinutes,
  intervalMinutes,
  capacity,
  capacityModel,
  date,
  now,
  bookings,
  from,
  to,
}) {
  if (isBlocked(date, blockedPeriods)) return [];

  const hours = hoursForDate(workingHours, date);
  if (!hours) return [];

  const slots = generateSlots({
    open: hours.open,
    close: hours.close,
    durationMinutes,
    intervalMinutes,
  }).filter((slot) => {
    if (from && slot.startTime < from) return false;
    if (to && slot.startTime > to) return false;
    return true;
  });

  return decorateSlots(slots, bookings, capacity, capacityModel, now, date, {
    durationMinutes,
    intervalMinutes,
  });
}
