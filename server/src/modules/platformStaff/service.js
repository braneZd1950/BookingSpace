import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import { isPlatformSuperAdmin } from '../../utils/analytics.js';
import { HttpError } from '../../utils/httpError.js';
import { generateMemberPassword } from '../../utils/password.js';

const BCRYPT_ROUNDS = 12;

function requireSuper(actor) {
  if (!isPlatformSuperAdmin(actor)) {
    throw new HttpError(403, 'Forbidden', { code: 'FORBIDDEN' });
  }
}

function toStaff(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listPlatformStaff(actor) {
  requireSuper(actor);
  const rows = await User.find({
    role: { $in: ['ADMIN', 'PLATFORM_STAFF'] },
  })
    .sort({ role: 1, name: 1 })
    .select('name email phone role createdAt updatedAt')
    .lean();

  return {
    staff: rows.map(toStaff),
    summary: {
      total: rows.length,
      admins: rows.filter((row) => row.role === 'ADMIN').length,
      operators: rows.filter((row) => row.role === 'PLATFORM_STAFF').length,
    },
  };
}

export async function createPlatformStaff(actor, input) {
  requireSuper(actor);

  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const phone = input.phone?.trim() || undefined;
  let temporaryPassword = null;
  let password = input.password?.trim() || '';

  if (password && password.length < 8) {
    throw new HttpError(400, 'Password too short', { code: 'WEAK_PASSWORD' });
  }

  const existing = await User.findOne({ email }).select('+passwordHash name email phone role');
  if (existing) {
    if (existing.role === 'ADMIN') {
      throw new HttpError(409, 'Cannot change super admin via API', { code: 'IS_SUPER_ADMIN' });
    }
    if (existing.role === 'PLATFORM_STAFF') {
      throw new HttpError(409, 'Already platform staff', { code: 'STAFF_EXISTS' });
    }
    if (existing.role === 'BUSINESS_OWNER') {
      throw new HttpError(409, 'Email belongs to a studio owner', { code: 'EMAIL_IS_OWNER' });
    }
    if (existing.role === 'STAFF') {
      throw new HttpError(409, 'Email belongs to studio staff', { code: 'EMAIL_IS_STUDIO_STAFF' });
    }

    existing.role = 'PLATFORM_STAFF';
    existing.name = name || existing.name;
    if (phone !== undefined) existing.phone = phone;
    if (password) {
      existing.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }
    await existing.save();
    return {
      staff: toStaff(existing),
      accountCreated: false,
      temporaryPassword: null,
    };
  }

  if (!password) {
    temporaryPassword = generateMemberPassword();
    password = temporaryPassword;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const created = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: 'PLATFORM_STAFF',
    privacyConsent: {
      accepted: true,
      version: 'platform-staff',
      acceptedAt: new Date(),
      source: 'admin',
    },
  });

  return {
    staff: toStaff(created),
    accountCreated: true,
    temporaryPassword,
  };
}

export async function updatePlatformStaff(actor, staffId, input) {
  requireSuper(actor);

  const user = await User.findById(staffId);
  if (!user) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  if (user.role === 'ADMIN') {
    throw new HttpError(403, 'Cannot edit super admin via API', { code: 'IS_SUPER_ADMIN' });
  }
  if (user.role !== 'PLATFORM_STAFF') {
    throw new HttpError(400, 'Not platform staff', { code: 'NOT_PLATFORM_STAFF' });
  }

  if (input.name !== undefined) user.name = input.name.trim();
  if (input.phone !== undefined) user.phone = input.phone.trim();
  if (input.password?.trim()) {
    if (input.password.trim().length < 8) {
      throw new HttpError(400, 'Password too short', { code: 'WEAK_PASSWORD' });
    }
    user.passwordHash = await bcrypt.hash(input.password.trim(), BCRYPT_ROUNDS);
  }
  await user.save();
  return { staff: toStaff(user) };
}

export async function removePlatformStaff(actor, staffId) {
  requireSuper(actor);

  if (String(actor._id) === String(staffId)) {
    throw new HttpError(400, 'Cannot remove yourself', { code: 'SELF_REMOVE' });
  }

  const user = await User.findById(staffId);
  if (!user) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  if (user.role === 'ADMIN') {
    throw new HttpError(403, 'Cannot remove super admin via API', { code: 'IS_SUPER_ADMIN' });
  }
  if (user.role !== 'PLATFORM_STAFF') {
    throw new HttpError(400, 'Not platform staff', { code: 'NOT_PLATFORM_STAFF' });
  }

  user.role = 'CUSTOMER';
  await user.save();
  return { ok: true, staff: toStaff(user) };
}
