import Tenant from '../../models/Tenant.js';
import User from '../../models/User.js';
import { HttpError } from '../../utils/httpError.js';
import { verifyAccessToken } from '../../utils/token.js';
import {
  buildPlatformReports,
  getPlatformSystem,
  isPlatformAdmin,
  listPlatformActivity,
  listPlatformStudios,
  listPlatformUsers,
  summarizeUsage,
  trackUsage,
} from '../../utils/analytics.js';
import {
  listPlatformBilling,
  sendBillingInvoice,
  sendBillingWarning,
  updatePlatformBilling,
} from '../../utils/billing.js';
import { createExportSeal, verifyExportSeal } from '../../utils/exportSeal.js';
import { MANAGE_ROLES, requireMember } from '../access.js';

async function optionalUser(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;
  try {
    const payload = verifyAccessToken(match[1]);
    return User.findById(payload.sub);
  } catch {
    return null;
  }
}

export async function trackHandler(req, res) {
  const user = await optionalUser(req);
  trackUsage({
    type: req.input.body.type,
    path: req.input.body.path,
    tenantId: req.input.body.tenantId,
    userId: user?._id,
    role: user?.role,
  });
  res.status(204).send();
}

export async function platformHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const summary = await summarizeUsage({ days: req.input.query.days });
  const [tenants, users] = await Promise.all([
    Tenant.countDocuments(),
    User.countDocuments(),
  ]);
  res.json({
    scope: 'platform',
    ...summary,
    inventory: { tenants, users },
  });
}

export async function studioHandler(req, res) {
  await requireMember(req.user, req.input.params.tenantId, MANAGE_ROLES);
  const summary = await summarizeUsage({
    tenantId: req.input.params.tenantId,
    days: req.input.query.days,
  });
  res.json({
    scope: 'studio',
    tenantId: req.input.params.tenantId,
    ...summary,
  });
}

export async function platformStudiosHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await listPlatformStudios({ days: req.input.query.days });
  res.json(result);
}

export async function platformUsersHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await listPlatformUsers({ days: req.input.query.days });
  res.json(result);
}

export async function platformActivityHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await listPlatformActivity({
    days: req.input.query.days,
    type: req.input.query.type,
    limit: req.input.query.limit,
  });
  res.json(result);
}

export async function platformReportsHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await buildPlatformReports({ days: req.input.query.days });
  res.json(result);
}

export async function platformSystemHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await getPlatformSystem();
  res.json(result);
}

export async function platformBillingHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await listPlatformBilling();
  res.json(result);
}

export async function platformBillingUpdateHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const studio = await updatePlatformBilling(req.input.params.tenantId, req.input.body);
  res.json({ studio });
}

export async function platformBillingWarnHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await sendBillingWarning(req.input.params.tenantId);
  res.json(result);
}

export async function platformBillingInvoiceHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = await sendBillingInvoice(req.input.params.tenantId);
  res.json(result);
}

export async function platformExportSealHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const seal = createExportSeal({
    documentId: req.input.body.documentId,
    title: req.input.body.title,
    fileStem: req.input.body.fileStem,
    contentHash: req.input.body.contentHash,
    user: req.user,
  });
  res.json({ seal });
}

export async function platformExportVerifyHandler(req, res) {
  if (!isPlatformAdmin(req.user)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
  const result = verifyExportSeal(req.input.body);
  res.json(result);
}
