import Membership from '../../models/Membership.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';
import { createWithCode } from '../../utils/codes.js';
import { HttpError } from '../../utils/httpError.js';
import { MANAGE_ROLES, requireMember } from '../access.js';

export function toPayment(payment) {
  return {
    id: payment._id,
    code: payment.code,
    tenantId: payment.tenantId,
    userId: payment.userId,
    membershipId: payment.membershipId || null,
    amount: payment.amount,
    currency: payment.currency,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    note: payment.note || '',
    createdBy: payment.createdBy,
  };
}

export async function listPayments(user, tenantId, limit) {
  await requireMember(user, tenantId, MANAGE_ROLES);
  const payments = await Payment.find({ tenantId }).sort({ paidAt: -1 }).limit(limit);
  return payments.map(toPayment);
}

export async function recordPayment(actor, tenantId, input) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const customer = await User.findById(input.userId).select('_id');
  if (!customer) throw new HttpError(404, 'Customer not found', { code: 'NOT_FOUND' });

  if (input.membershipId) {
    const membership = await Membership.findOne({
      _id: input.membershipId,
      tenantId,
      userId: input.userId,
    }).select('_id');
    if (!membership) throw new HttpError(404, 'Membership not found', { code: 'NOT_FOUND' });
  }

  const payment = await createWithCode(Payment, 'PAY', {
    tenantId,
    userId: input.userId,
    membershipId: input.membershipId,
    amount: input.amount,
    currency: 'EUR',
    method: input.method,
    status: 'PAID',
    paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
    note: input.note,
    createdBy: actor._id,
  });
  return toPayment(payment);
}
