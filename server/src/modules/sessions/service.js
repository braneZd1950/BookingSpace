import Booking from '../../models/Booking.js';
import Service from '../../models/Service.js';
import Tenant from '../../models/Tenant.js';
import { HttpError } from '../../utils/httpError.js';
import { zonedNow } from '../../utils/time.js';
import { buildDaySlots } from './slots.js';

export async function getAvailability(tenantId, serviceId, query) {
  const tenant = await Tenant.findOne({ _id: tenantId, active: true });
  const service = await Service.findOne({ _id: serviceId, tenantId, active: true });
  if (!tenant || !service) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const bookings = await Booking.find({
    tenantId,
    serviceId,
    date: query.date,
    status: 'CONFIRMED',
  }).select('startTime endTime status');

  const slots = buildDaySlots({
    workingHours: tenant.bookingSettings?.workingHours || [],
    blockedPeriods: tenant.bookingSettings?.blockedPeriods || [],
    durationMinutes: service.durationMinutes,
    intervalMinutes: service.slotIntervalMinutes,
    capacity: service.capacity,
    capacityModel: tenant.bookingSettings?.capacityModel || 'PER_SLOT',
    date: query.date,
    now: zonedNow(tenant.timezone || 'Europe/Zagreb'),
    bookings,
    from: query.from,
    to: query.to,
  });

  return {
    date: query.date,
    timezone: tenant.timezone,
    capacityModel: tenant.bookingSettings?.capacityModel || 'PER_SLOT',
    slots,
  };
}
