import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import env from '../../config/env.js';
import { trackUsage } from '../../utils/analytics.js';
import { HttpError } from '../../utils/httpError.js';
import { sendPasswordResetEmail } from '../../utils/mail.js';
import { signAccessToken } from '../../utils/token.js';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000;
const dummyHash = bcrypt.hashSync('timing-only-secret', BCRYPT_ROUNDS);

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function registerUser(input) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await User.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      passwordHash,
      role: input.role,
    });

    trackUsage({
      type: 'register_success',
      userId: user._id,
      role: user.role,
      path: '/register',
    });

    return {
      user: toPublicUser(user),
      token: signAccessToken(user),
    };
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });
    }
    throw error;
  }
}

export async function loginUser(input) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  const passwordOk = await bcrypt.compare(input.password, user?.passwordHash || dummyHash);

  if (!user || !passwordOk) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

  trackUsage({
    type: 'login_success',
    userId: user._id,
    role: user.role,
    path: '/login',
  });

  return {
    user: toPublicUser(user),
    token: signAccessToken(user),
  };
}

export async function updateMe(user, input) {
  if (input.email && input.email !== user.email) {
    const taken = await User.exists({ email: input.email, _id: { $ne: user._id } });
    if (taken) throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });
    user.email = input.email;
  }
  if (input.name) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone || undefined;
  await user.save();
  return toPublicUser(user);
}

export async function changePassword(user, input) {
  const current = await User.findById(user._id).select('+passwordHash');
  if (!current) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const passwordOk = await bcrypt.compare(input.currentPassword, current.passwordHash || dummyHash);
  if (!passwordOk) {
    throw new HttpError(401, 'Current password is incorrect', { code: 'INVALID_CREDENTIALS' });
  }

  current.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  current.passwordResetTokenHash = undefined;
  current.passwordResetExpires = undefined;
  await current.save();
  return { ok: true };
}

/** Always returns the same message so emails are not enumerable. */
export async function requestPasswordReset(input) {
  const ok = {
    ok: true,
    message: 'Ako račun postoji, poslali smo link za oporavak lozinke.',
  };

  const user = await User.findOne({ email: input.email })
    .select('+passwordResetTokenHash +passwordResetExpires');
  if (!user) return ok;

  const token = randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashResetToken(token);
  user.passwordResetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const origin = env.clientOrigin.replace(/\/$/, '');
  const resetUrl = `${origin}/nova-lozinka?token=${encodeURIComponent(token)}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      memberName: user.name,
      resetUrl,
    });
    trackUsage({
      type: 'password_reset_requested',
      userId: user._id,
      role: user.role,
      path: '/zaboravljena-lozinka',
    });
  } catch (error) {
    console.error('[mail] Oporavak lozinke nije poslan:', error?.message || error);
  }

  return ok;
}

export async function resetPasswordWithToken(input) {
  const tokenHash = hashResetToken(input.token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordHash +passwordResetTokenHash +passwordResetExpires');

  if (!user) {
    throw new HttpError(400, 'Reset link is invalid or expired', { code: 'RESET_INVALID' });
  }

  user.passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { ok: true };
}
