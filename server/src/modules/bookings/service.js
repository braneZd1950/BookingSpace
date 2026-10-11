import Booking from '../../models/Booking.js';
import Membership from '../../models/Membership.js';
import MembershipPlan from '../../models/MembershipPlan.js';
import Service from '../../models/Service.js';
import Tenant from '../../models/Tenant.js';
import TenantUser from '../../models/TenantUser.js';
import User from '../../models/User.js';
import { trackUsage } from '../../utils/analytics.js';
import { HttpError } from '../../utils/httpError.js';
import { overlaps, withinCancellationWindow, zonedNow } from '../../utils/time.js';
import { createDoc, sessionOptions, withTransaction } from '../../utils/transaction.js';
import { MANAGE_ROLES, requireMember } from '../access.js';
import { buildDaySlots } from '../sessions/slots.js';

function notFound(error) {
  if (error?.status === 403) {
    throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  }
  throw error;
}

function allowsService(plan, serviceId) {
  if (!plan?.allowedServiceIds?.length) return true;
  return plan.allowedServiceIds.some((id) => String(id) === String(serviceId));
}

function hasSessions(membership) {
  return membership.sessionsIncluded == null || membership.sessionsUsed < membership.sessionsIncluded;
}

function bind(query, session) {
  return session ? query.session(session) : query;
}

export function toBooking(booking) {
  const userDoc = booking.userId?.email || booking.userId?.name ? booking.userId : null;
  const serviceDoc = booking.serviceId?.name ? booking.serviceId : null;

  return {
    id: booking._id,
    tenantId: booking.tenantId,
    serviceId: serviceDoc?._id || booking.serviceId,
    serviceName: serviceDoc?.name || undefined,
    serviceCapacity: serviceDoc?.capacity ?? undefined,
    userId: userDoc?._id || booking.userId,
    user: userDoc ? {
      id: userDoc._id,
      name: userDoc.name,
      email: userDoc.email || null,
    } : undefined,
    membershipId: booking.membershipId || null,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    source: booking.source,
    cancelledAt: booking.cancelledAt || null,
    completedAt: booking.completedAt || null,
  };
}

async function staffAccess(user, tenantId) {
  try {
    await requireMember(user, tenantId, MANAGE_ROLES);
    return true;
  } catch (error) {
    return notFound(error);
  }
}

export async function createBooking(actor, input) {
  const service = await Service.findOne({ _id: input.serviceId, active: true });
  const tenant = service ? await Tenant.findOne({ _id: service.tenantId, active: true }) : null;
  if (!service || !tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  let customerId = actor._id;
  if (input.userId && String(input.userId) !== String(actor._id)) {
    await requireMember(actor, tenant._id, MANAGE_ROLES);
    const customer = await User.findById(input.userId).select('_id');
    if (!customer) throw new HttpError(404, 'Customer not found', { code: 'NOT_FOUND' });
    customerId = customer._id;
  }

  const booking = await withTransaction(async (session) => {
    const confirmed = await bind(Booking.find({
      tenantId: tenant._id,
      serviceId: service._id,
      date: input.date,
      status: 'CONFIRMED',
    }).select('startTime endTime status'), session);

    const slots = buildDaySlots({
      workingHours: tenant.bookingSettings?.workingHours || [],
      blockedPeriods: tenant.bookingSettings?.blockedPeriods || [],
      durationMinutes: service.durationMinutes,
      intervalMinutes: service.slotIntervalMinutes,
      capacity: service.capacity,
      capacityModel: tenant.bookingSettings?.capacityModel || 'PER_SLOT',
      date: input.date,
      now: zonedNow(tenant.timezone || 'Europe/Zagreb'),
      bookings: confirmed,
    });
    const slot = slots.find((item) => item.startTime === input.startTime);
    if (!slot || slot.status !== 'AVAILABLE') {
      throw new HttpError(409, 'Slot is not available', { code: 'SLOT_UNAVAILABLE' });
    }

    const ownBookings = await bind(Booking.find({
      tenantId: tenant._id,
      userId: customerId,
      date: input.date,
      status: 'CONFIRMED',
    }).select('startTime endTime'), session);

    const conflict = ownBookings.some((item) => overlaps(
      slot.startTime,
      slot.endTime,
      item.startTime,
      item.endTime,
    ));
    if (conflict) throw new HttpError(409, 'Conflicting booking', { code: 'BOOKING_CONFLICT' });

    let membershipId;
    if (service.membershipRequired) {
      const memberships = await bind(Membership.find({
        tenantId: tenant._id,
        userId: customerId,
        status: 'ACTIVE',
        validFrom: { $lte: input.date },
        validUntil: { $gte: input.date },
      }), session);
      const plans = await bind(MembershipPlan.find({
        _id: { $in: memberships.map((item) => item.membershipPlanId) },
      }), session);
      const plansById = new Map(plans.map((plan) => [String(plan._id), plan]));
      const chosen = memberships
        .filter((item) => hasSessions(item) && allowsService(plansById.get(String(item.membershipPlanId)), service._id))
        .sort((a, b) => a.validUntil.localeCompare(b.validUntil))[0];

      if (!chosen) {
        throw new HttpError(403, 'Membership required', { code: 'MEMBERSHIP_REQUIRED' });
      }

      if (chosen.sessionsIncluded != null) {
        const updated = await Membership.findOneAndUpdate(
          {
            _id: chosen._id,
            status: 'ACTIVE',
            sessionsIncluded: { $ne: null },
            $expr: { $lt: ['$sessionsUsed', '$sessionsIncluded'] },
          },
          { $inc: { sessionsUsed: 1 } },
          { new: true, ...sessionOptions(session) },
        );
        if (!updated) throw new HttpError(409, 'No sessions remaining', { code: 'NO_SESSIONS' });
      }
      membershipId = chosen._id;
    }

    const existingLink = await bind(TenantUser.findOne({
      tenantId: tenant._id,
      userId: customerId,
    }), session);
    if (!existingLink) {
      await createDoc(TenantUser, {
        tenantId: tenant._id,
        userId: customerId,
        role: 'CUSTOMER',
        status: 'ACTIVE',
      }, session);
    }

    try {
      return await createDoc(Booking, {
        tenantId: tenant._id,
        serviceId: service._id,
        userId: customerId,
        membershipId,
        date: input.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: 'CONFIRMED',
        source: String(customerId) === String(actor._id) ? 'CUSTOMER' : 'STAFF',
      }, session);
    } catch (error) {
      if (error?.code === 11000) {
        throw new HttpError(409, 'Conflicting booking', { code: 'BOOKING_CONFLICT' });
      }
      throw error;
    }
  });

  trackUsage({
    type: 'booking_created',
    tenantId: tenant._id,
    userId: actor._id,
    role: actor.role,
    path: '/bookings',
  });

  return toBooking(booking);
}

export async function listMyBookings(user, limit) {
  const bookings = await Booking.find({ userId: user._id })
    .sort({ date: -1, startTime: -1 })
    .limit(limit)
    .populate('serviceId', 'name capacity');
  return bookings.map(toBooking);
}

export async function listTenantBookings(user, tenantId, query) {
  await requireMember(user, tenantId, MANAGE_ROLES);
  const filter = { tenantId };
  if (query.date) {
    filter.date = query.date;
  } else if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = query.dateFrom;
    if (query.dateTo) filter.date.$lte = query.dateTo;
  }
  const bookings = await Booking.find(filter)
    .populate('userId', 'name email')
    .populate('serviceId', 'name capacity')
    .sort({ date: 1, startTime: 1 })
    .limit(query.limit);
  return bookings.map(toBooking);
}

async function loadManageable(actor, bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  const owns = String(booking.userId) === String(actor._id);
  if (!owns) await staffAccess(actor, booking.tenantId);
  return booking;
}

export async function cancelBooking(actor, bookingId) {
  const existing = await loadManageable(actor, bookingId);
  const [tenant, service] = await Promise.all([
    Tenant.findById(existing.tenantId),
    Service.findById(existing.serviceId),
  ]);
  if (!tenant || !service) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  if (existing.status !== 'CONFIRMED') {
    throw new HttpError(409, 'Booking cannot be cancelled', { code: 'INVALID_STATE' });
  }

  const owns = String(existing.userId) === String(actor._id);
  let staff = false;
  if (!owns) {
    await staffAccess(actor, existing.tenantId);
    staff = true;
  }
  const now = zonedNow(tenant.timezone || 'Europe/Zagreb');
  const inWindow = withinCancellationWindow(
    now,
    existing.date,
    existing.startTime,
    service.cancellationWindowMinutes,
  );
  if (!inWindow && !staff) {
    throw new HttpError(403, 'Cancellation window has passed', { code: 'CANCELLATION_WINDOW' });
  }

  const booking = await withTransaction(async (session) => {
    const current = await bind(Booking.findOne({ _id: bookingId, status: 'CONFIRMED' }), session);
    if (!current) throw new HttpError(409, 'Booking cannot be cancelled', { code: 'INVALID_STATE' });
    current.status = 'CANCELLED';
    current.cancelledAt = new Date();
    await current.save(sessionOptions(session));

    if (inWindow && current.membershipId) {
      await Membership.updateOne(
        {
          _id: current.membershipId,
          sessionsIncluded: { $ne: null },
          sessionsUsed: { $gt: 0 },
        },
        { $inc: { sessionsUsed: -1 } },
        sessionOptions(session),
      );
    }
    return current;
  });

  trackUsage({
    type: 'booking_cancelled',
    tenantId: existing.tenantId,
    userId: actor._id,
    role: actor.role,
    path: '/bookings',
  });

  return toBooking(booking);
}

async function mark(actor, bookingId, status, stamp) {
  const booking = await loadManageable(actor, bookingId);
  await staffAccess(actor, booking.tenantId);
  if (booking.status !== 'CONFIRMED') {
    throw new HttpError(409, 'Booking cannot be updated', { code: 'INVALID_STATE' });
  }
  booking.status = status;
  booking[stamp] = new Date();
  await booking.save();
  return toBooking(booking);
}

export function completeBooking(actor, bookingId) {
  return mark(actor, bookingId, 'COMPLETED', 'completedAt');
}

export async function markNoShow(actor, bookingId) {
  const booking = await loadManageable(actor, bookingId);
  await staffAccess(actor, booking.tenantId);
  if (booking.status !== 'CONFIRMED') {
    throw new HttpError(409, 'Booking cannot be updated', { code: 'INVALID_STATE' });
  }
  booking.status = 'NO_SHOW';
  await booking.save();
  return toBooking(booking);
}
