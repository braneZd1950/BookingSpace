import Booking from '../../models/Booking.js';
import Membership from '../../models/Membership.js';
import Payment from '../../models/Payment.js';
import TenantUser from '../../models/TenantUser.js';
import User from '../../models/User.js';
import { HttpError } from '../../utils/httpError.js';
import { MANAGE_ROLES, requireMember } from '../access.js';
import { toBooking } from '../bookings/service.js';
import { toMembership } from '../memberships/service.js';
import { toPayment } from '../payments/service.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toCustomer(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
  };
}

export async function listCustomers(actor, tenantId, query) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const links = await TenantUser.find({ tenantId, role: 'CUSTOMER', status: 'ACTIVE' }).select('userId');
  const ids = links.map((link) => link.userId);
  const filter = { _id: { $in: ids } };
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }
  const users = await User.find(filter).sort({ name: 1 }).limit(query.limit);
  return users.map(toCustomer);
}

export async function getCustomer(actor, tenantId, userId) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const [link, membershipCount, bookingCount] = await Promise.all([
    TenantUser.exists({ tenantId, userId }),
    Membership.exists({ tenantId, userId }),
    Booking.exists({ tenantId, userId }),
  ]);
  if (!link && !membershipCount && !bookingCount) {
    throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  }

  const user = await User.findById(userId).select('name email phone');
  if (!user) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const [memberships, bookings, payments] = await Promise.all([
    Membership.find({ tenantId, userId }).sort({ createdAt: -1 }).limit(20).populate('membershipPlanId', 'name'),
    Booking.find({ tenantId, userId }).sort({ date: -1, startTime: -1 }).limit(20),
    Payment.find({ tenantId, userId }).sort({ paidAt: -1 }).limit(20),
  ]);

  return {
    customer: toCustomer(user),
    memberships: memberships.map(toMembership),
    bookings: bookings.map(toBooking),
    payments: payments.map(toPayment),
  };
}
