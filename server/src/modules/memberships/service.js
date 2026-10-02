import bcrypt from 'bcryptjs';
import Membership from '../../models/Membership.js';
import MembershipPlan from '../../models/MembershipPlan.js';
import Payment from '../../models/Payment.js';
import Service from '../../models/Service.js';
import Tenant from '../../models/Tenant.js';
import TenantUser from '../../models/TenantUser.js';
import User from '../../models/User.js';
import { createWithCode } from '../../utils/codes.js';
import { HttpError } from '../../utils/httpError.js';
import { addDays, zonedNow } from '../../utils/time.js';
import { createDoc, sessionOptions, withTransaction } from '../../utils/transaction.js';
import { MANAGE_ROLES, requireMember } from '../access.js';

const BCRYPT_ROUNDS = 12;

function bind(query, session) {
  return session ? query.session(session) : query;
}

function hideForbidden(error) {
  if (error?.status === 403) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  throw error;
}

export function toPlan(plan) {
  return {
    id: plan._id,
    tenantId: plan.tenantId,
    name: plan.name,
    description: plan.description || '',
    price: plan.price,
    validityDays: plan.validityDays,
    sessionsIncluded: plan.sessionsIncluded ?? null,
    allowedServiceIds: plan.allowedServiceIds || [],
    active: plan.active,
  };
}

export function toMembership(membership) {
  const plan = membership.membershipPlanId?.name ? membership.membershipPlanId : null;
  const sessionsIncluded = membership.sessionsIncluded ?? null;
  return {
    id: membership._id,
    code: membership.code,
    tenantId: membership.tenantId,
    userId: membership.userId?._id || membership.userId,
    user: membership.userId?.email ? {
      id: membership.userId._id,
      name: membership.userId.name,
      email: membership.userId.email,
      phone: membership.userId.phone || null,
    } : undefined,
    membershipPlanId: plan?._id || membership.membershipPlanId,
    planName: plan?.name,
    paymentId: membership.paymentId || null,
    validFrom: membership.validFrom,
    validUntil: membership.validUntil,
    sessionsIncluded,
    sessionsUsed: membership.sessionsUsed,
    sessionsRemaining: sessionsIncluded == null ? null : sessionsIncluded - membership.sessionsUsed,
    status: membership.status,
  };
}

async function assertServices(tenantId, serviceIds = []) {
  if (serviceIds.length === 0) return;
  const count = await Service.countDocuments({ _id: { $in: serviceIds }, tenantId });
  if (count !== serviceIds.length) {
    throw new HttpError(400, 'Unknown service', { code: 'INVALID_SERVICE' });
  }
}

export async function listPlans(user, tenantId) {
  await requireMember(user, tenantId, MANAGE_ROLES);
  const plans = await MembershipPlan.find({ tenantId }).sort({ name: 1 });
  return plans.map(toPlan);
}

export async function createPlan(user, tenantId, input) {
  await requireMember(user, tenantId, MANAGE_ROLES);
  const tenant = await Tenant.findById(tenantId).select('_id');
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  await assertServices(tenantId, input.allowedServiceIds);
  const plan = await MembershipPlan.create({
    ...input,
    tenantId,
    sessionsIncluded: input.sessionsIncluded ?? null,
  });
  return toPlan(plan);
}

export async function updatePlan(user, planId, input) {
  const plan = await MembershipPlan.findById(planId);
  if (!plan) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  try {
    await requireMember(user, plan.tenantId, MANAGE_ROLES);
  } catch (error) {
    hideForbidden(error);
  }
  if (input.allowedServiceIds) await assertServices(plan.tenantId, input.allowedServiceIds);
  Object.assign(plan, input);
  await plan.save();
  return toPlan(plan);
}

async function resolveCustomer(tenantId, input, session) {
  if (input.userId) {
    const user = await bind(User.findById(input.userId).select('_id name email phone'), session);
    if (!user) throw new HttpError(404, 'Customer not found', { code: 'NOT_FOUND' });
    return user;
  }

  const existing = await bind(User.findOne({ email: input.customer.email }).select('_id name email phone'), session);
  if (existing) return existing;

  const passwordHash = await bcrypt.hash(input.customer.password, BCRYPT_ROUNDS);
  return createDoc(User, {
    name: input.customer.name,
    email: input.customer.email,
    phone: input.customer.phone,
    passwordHash,
    role: 'CUSTOMER',
  }, session);
}

async function ensureCustomerLink(tenantId, userId, session) {
  const existing = await bind(TenantUser.findOne({ tenantId, userId }), session);
  if (existing) return existing;
  return createDoc(TenantUser, {
    tenantId,
    userId,
    role: 'CUSTOMER',
    status: 'ACTIVE',
  }, session);
}

export async function activateMembership(actor, tenantId, input) {
  await requireMember(actor, tenantId, MANAGE_ROLES);
  const tenant = await Tenant.findById(tenantId);
  const plan = await MembershipPlan.findOne({ _id: input.membershipPlanId, tenantId, active: true });
  if (!tenant || !plan) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  return withTransaction(async (session) => {
    const user = await resolveCustomer(tenantId, input, session);
    await ensureCustomerLink(tenantId, user._id, session);
    const validFrom = input.validFrom || zonedNow(tenant.timezone || 'Europe/Zagreb').date;
    const validUntil = addDays(validFrom, plan.validityDays - 1);
    const payment = await createWithCode(Payment, 'PAY', {
      tenantId,
      userId: user._id,
      amount: input.amount ?? plan.price,
      currency: 'EUR',
      method: input.method,
      status: 'PAID',
      paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
      note: input.note,
      createdBy: actor._id,
    }, session);
    const membership = await createWithCode(Membership, 'MEM', {
      tenantId,
      userId: user._id,
      membershipPlanId: plan._id,
      paymentId: payment._id,
      validFrom,
      validUntil,
      sessionsIncluded: plan.sessionsIncluded ?? null,
      sessionsUsed: 0,
      status: 'ACTIVE',
    }, session);
    payment.membershipId = membership._id;
    await payment.save(sessionOptions(session));
    return {
      membership: toMembership({ ...membership.toObject(), membershipPlanId: plan, userId: user }),
      paymentId: payment._id,
      paymentCode: payment.code,
    };
  });
}

export async function listMemberships(user, tenantId, limit) {
  await requireMember(user, tenantId, MANAGE_ROLES);
  const memberships = await Membership.find({ tenantId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email phone')
    .populate('membershipPlanId', 'name');
  return memberships.map(toMembership);
}

export async function listMyMemberships(user, limit) {
  const memberships = await Membership.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('membershipPlanId', 'name');
  return memberships.map(toMembership);
}

export async function suspendMembership(user, membershipId) {
  const membership = await Membership.findById(membershipId);
  if (!membership) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  try {
    await requireMember(user, membership.tenantId, MANAGE_ROLES);
  } catch (error) {
    hideForbidden(error);
  }
  if (membership.status !== 'ACTIVE') {
    throw new HttpError(409, 'Membership cannot be suspended', { code: 'INVALID_STATE' });
  }
  membership.status = 'SUSPENDED';
  await membership.save();
  return toMembership(membership);
}
