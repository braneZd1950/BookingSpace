import mongoose from 'mongoose';
import TenantUser from '../models/TenantUser.js';
import { HttpError } from '../utils/httpError.js';

export const MANAGE_ROLES = ['BUSINESS_OWNER', 'STAFF'];

export async function requireMember(user, tenantId, roles = []) {
  if (!mongoose.isValidObjectId(tenantId)) {
    throw new HttpError(400, 'Invalid id', { code: 'INVALID_ID' });
  }

  if (user.role === 'ADMIN') {
    return { tenantId, userId: user._id, role: 'ADMIN' };
  }

  const access = await TenantUser.findOne({
    tenantId,
    userId: user._id,
    status: 'ACTIVE',
  });

  if (!access || (roles.length > 0 && !roles.includes(access.role))) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }

  return access;
}

/**
 * Ensure target user is already linked to the tenant before binding payments/bookings.
 * Returns 404 (not 403) to avoid cross-tenant user existence leaks.
 */
export async function assertTenantLinkedUser(
  tenantId,
  userId,
  { statuses = ['ACTIVE'] } = {},
) {
  if (!mongoose.isValidObjectId(tenantId) || !mongoose.isValidObjectId(userId)) {
    throw new HttpError(400, 'Invalid id', { code: 'INVALID_ID' });
  }

  const link = await TenantUser.findOne({
    tenantId,
    userId,
    status: { $in: statuses },
  }).select('_id role status');

  if (!link) {
    throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  }

  return link;
}

export function requireTenantRole(...roles) {
  return async (req, res, next) => {
    try {
      req.tenantAccess = await requireMember(req.user, req.params.tenantId, roles);
      next();
    } catch (error) {
      next(error);
    }
  };
}
