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
