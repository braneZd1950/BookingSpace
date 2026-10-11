import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { HttpError } from './httpError.js';
import {
  sendSubscriptionInvoiceEmail,
  sendSubscriptionWarningEmail,
} from './mail.js';
import { addDays, zonedNow } from './time.js';

const EXPIRING_DAYS = 14;

function todayZagreb() {
  return zonedNow('Europe/Zagreb').date;
}

function daysUntil(validUntil, today = todayZagreb()) {
  if (!validUntil) return null;
  const start = new Date(`${today}T12:00:00Z`).getTime();
  const end = new Date(`${validUntil}T12:00:00Z`).getTime();
  return Math.round((end - start) / 86400000);
}

function deriveState(billing, today = todayZagreb()) {
  const status = billing?.status || 'TRIAL';
  const validUntil = billing?.validUntil || null;
  const left = daysUntil(validUntil, today);

  if (status === 'UNPAID') {
    return { bucket: 'unpaid', label: 'Neplaćeno', daysLeft: left };
  }
  if (left == null) {
    return { bucket: 'unknown', label: 'Bez datuma', daysLeft: null };
  }
  if (left < 0 || status === 'EXPIRED') {
    return { bucket: 'expired', label: 'Isteklo', daysLeft: left };
  }
  if (left <= EXPIRING_DAYS || status === 'PAST_DUE') {
    return { bucket: 'expiring', label: 'Pred istek', daysLeft: left };
  }
  if (status === 'PAID' || status === 'TRIAL') {
    return {
      bucket: status === 'TRIAL' ? 'trial' : 'paid',
      label: status === 'TRIAL' ? 'Probni period' : 'Plaćeno',
      daysLeft: left,
    };
  }
  return { bucket: 'unknown', label: status, daysLeft: left };
}

function ensureBilling(tenant) {
  const today = todayZagreb();
  if (!tenant.billing) tenant.billing = {};
  if (!tenant.billing.status) tenant.billing.status = 'TRIAL';
  if (!tenant.billing.plan) tenant.billing.plan = 'pilot';
  if (!tenant.billing.currency) tenant.billing.currency = 'EUR';
  if (tenant.billing.amount == null) tenant.billing.amount = 0;
  if (!tenant.billing.validUntil) {
    const base = tenant.createdAt
      ? new Date(tenant.createdAt).toISOString().slice(0, 10)
      : today;
    tenant.billing.validUntil = addDays(base, 30);
  }
  return tenant.billing;
}

export async function listPlatformBilling() {
  const today = todayZagreb();
  const tenants = await Tenant.find({})
    .sort({ name: 1 })
    .select('name slug email phone active createdAt billing ownerId')
    .populate('ownerId', 'name email');

  const rows = tenants.map((tenant) => {
    const billing = ensureBilling(tenant);
    const state = deriveState(billing, today);
    return {
      id: String(tenant._id),
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email || tenant.ownerId?.email || '',
      phone: tenant.phone || '',
      active: Boolean(tenant.active),
      ownerName: tenant.ownerId?.name || '',
      ownerEmail: tenant.ownerId?.email || '',
      plan: billing.plan || 'pilot',
      status: billing.status || 'TRIAL',
      validUntil: billing.validUntil || null,
      lastPaidAt: billing.lastPaidAt || null,
      amount: billing.amount || 0,
      currency: billing.currency || 'EUR',
      lastWarningSentAt: billing.lastWarningSentAt || null,
      lastInvoiceSentAt: billing.lastInvoiceSentAt || null,
      note: billing.note || '',
      bucket: state.bucket,
      label: state.label,
      daysLeft: state.daysLeft,
    };
  });

  return {
    today,
    summary: {
      total: rows.length,
      paid: rows.filter((item) => item.bucket === 'paid').length,
      trial: rows.filter((item) => item.bucket === 'trial').length,
      expiring: rows.filter((item) => item.bucket === 'expiring').length,
      unpaid: rows.filter((item) => item.bucket === 'unpaid').length,
      expired: rows.filter((item) => item.bucket === 'expired').length,
    },
    studios: rows,
  };
}

export async function updatePlatformBilling(tenantId, input) {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  ensureBilling(tenant);

  if (input.status) tenant.billing.status = input.status;
  if (input.plan) tenant.billing.plan = input.plan;
  if (input.validUntil !== undefined) tenant.billing.validUntil = input.validUntil || undefined;
  if (input.amount !== undefined) tenant.billing.amount = input.amount;
  if (input.currency) tenant.billing.currency = input.currency;
  if (input.note !== undefined) tenant.billing.note = input.note || '';
  if (input.markPaid) {
    tenant.billing.status = 'PAID';
    tenant.billing.lastPaidAt = new Date();
    if (!input.validUntil) {
      const base = tenant.billing.validUntil && daysUntil(tenant.billing.validUntil) >= 0
        ? tenant.billing.validUntil
        : todayZagreb();
      tenant.billing.validUntil = addDays(base, 30);
    }
  }

  await tenant.save();
  const list = await listPlatformBilling();
  return list.studios.find((item) => item.id === String(tenant._id));
}

async function resolveRecipient(tenant) {
  const email = tenant.email || null;
  if (email) {
    return { email, name: tenant.name };
  }
  const owner = await User.findById(tenant.ownerId).select('name email');
  if (!owner?.email) {
    throw new HttpError(400, 'Studio has no billing email', { code: 'NO_EMAIL' });
  }
  return { email: owner.email, name: owner.name || tenant.name };
}

export async function sendBillingWarning(tenantId) {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  const billing = ensureBilling(tenant);
  const state = deriveState(billing);
  const recipient = await resolveRecipient(tenant);

  await sendSubscriptionWarningEmail({
    to: recipient.email,
    contactName: recipient.name,
    studioName: tenant.name,
    validUntil: billing.validUntil,
    daysLeft: state.daysLeft,
    plan: billing.plan,
    amount: billing.amount,
    currency: billing.currency,
  });

  tenant.billing.lastWarningSentAt = new Date();
  await tenant.save();
  return { ok: true, to: recipient.email };
}

export async function sendBillingInvoice(tenantId) {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  const billing = ensureBilling(tenant);
  const recipient = await resolveRecipient(tenant);

  await sendSubscriptionInvoiceEmail({
    to: recipient.email,
    contactName: recipient.name,
    studioName: tenant.name,
    validUntil: billing.validUntil,
    plan: billing.plan,
    amount: billing.amount,
    currency: billing.currency,
    draft: true,
  });

  tenant.billing.lastInvoiceSentAt = new Date();
  await tenant.save();
  return { ok: true, to: recipient.email, draft: true };
}

export function defaultTrialBilling() {
  return {
    status: 'TRIAL',
    plan: 'pilot',
    validUntil: addDays(todayZagreb(), 30),
    amount: 0,
    currency: 'EUR',
  };
}
