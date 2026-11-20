import Booking from '../../models/Booking.js';
import Service from '../../models/Service.js';
import Tenant from '../../models/Tenant.js';
import { HttpError } from '../../utils/httpError.js';
import {
  dayPeak,
  groupDaySlots,
  loadLabel,
  occupancyLevel,
} from '../../../../shared/calendarOccupancy.js';
import { dayOpen, toDateKey } from '../../../../shared/studioTime.js';

const MAX_RANGE_DAYS = 62;

function parseKey(key) {
  const [y, m, d] = String(key || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function eachDateKey(dateFrom, dateTo) {
  const start = parseKey(dateFrom);
  const end = parseKey(dateTo);
  if (!start || !end || end < start) {
    throw new HttpError(400, 'Invalid date range', { code: 'INVALID_RANGE' });
  }
  const days = Math.round((end - start) / 86400000) + 1;
  if (days > MAX_RANGE_DAYS) {
    throw new HttpError(400, 'Date range too large', { code: 'RANGE_TOO_LARGE' });
  }
  const keys = [];
  let cursor = new Date(start);
  const last = end.getTime();
  while (cursor.getTime() <= last) {
    keys.push(toDateKey(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12, 0, 0, 0);
  }
  return keys;
}

/**
 * Public occupancy summary for clients — no member PII.
 * Capacity-based so it works for fitness, wellness, playrooms, etc.
 */
export async function getTenantOccupancy(tenantId, query = {}) {
  const tenant = await Tenant.findOne({ _id: tenantId, active: true })
    .select('timezone bookingSettings active');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const dateFrom = query.dateFrom;
  const dateTo = query.dateTo;
  if (!dateFrom || !dateTo) {
    throw new HttpError(400, 'dateFrom and dateTo are required', { code: 'INVALID_RANGE' });
  }
  const dateKeys = eachDateKey(dateFrom, dateTo);
  const serviceFilter = query.serviceId ? String(query.serviceId) : '';

  // Always return full service list so clients can keep filter chips visible.
  const services = await Service.find({
    tenantId,
    active: true,
  }).select('name capacity durationMinutes');

  const serviceById = new Map(
    services.map((item) => [String(item._id), item]),
  );
  const fallbackCapacity = Number(
    (serviceFilter ? serviceById.get(serviceFilter) : null)?.capacity
    || services[0]?.capacity,
  ) || 12;
  const workingHours = tenant.bookingSettings?.workingHours || [];

  const bookings = await Booking.find({
    tenantId,
    date: { $gte: dateFrom, $lte: dateTo },
    status: 'CONFIRMED',
    ...(serviceFilter ? { serviceId: serviceFilter } : {}),
  }).select('date startTime endTime serviceId');

  const byDate = new Map();
  for (const key of dateKeys) byDate.set(key, []);

  for (const row of bookings) {
    const key = String(row.date || '');
    if (!byDate.has(key)) continue;
    const sid = String(row.serviceId || '');
    if (serviceFilter && sid !== serviceFilter) continue;
    const service = serviceById.get(sid);
    byDate.get(key).push({
      date: key,
      startTime: row.startTime,
      endTime: row.endTime,
      serviceId: sid,
      serviceName: service?.name || 'Termin',
      serviceCapacity: Number(service?.capacity) || fallbackCapacity,
    });
  }

  const days = dateKeys.map((date) => {
    const list = byDate.get(date) || [];
    const open = dayOpen(workingHours, parseKey(date));
    const peak = dayPeak(list, fallbackCapacity);
    const level = occupancyLevel(peak.ratio, open);
    const slots = groupDaySlots(list, fallbackCapacity).map((slot) => {
      const booked = slot.members.length;
      const capacity = Math.max(1, slot.capacity || fallbackCapacity);
      const remaining = Math.max(0, capacity - booked);
      const ratio = Math.min(1, booked / capacity);
      const slotLevel = occupancyLevel(ratio, open);
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        serviceId: slot.serviceId,
        serviceName: slot.serviceName || 'Termin',
        booked,
        capacity,
        remaining,
        level: slotLevel,
        label: loadLabel(slotLevel),
        status: !open ? 'CLOSED' : remaining <= 0 ? 'FULL' : 'AVAILABLE',
      };
    });

    return {
      date,
      open,
      level,
      label: loadLabel(level),
      ratio: peak.ratio,
      peak: peak.peak,
      capacity: peak.capacity,
      bookingCount: peak.count,
      slots,
    };
  });

  return {
    tenantId: String(tenant._id),
    timezone: tenant.timezone || 'Europe/Zagreb',
    dateFrom,
    dateTo,
    services: services.map((item) => ({
      id: String(item._id),
      name: item.name,
      capacity: item.capacity,
    })),
    days,
  };
}
