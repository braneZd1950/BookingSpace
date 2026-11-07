import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import env from '../../config/env.js';
import { trackUsage } from '../../utils/analytics.js';
import { HttpError } from '../../utils/httpError.js';
import { sendPasswordResetEmail } from '../../utils/mail.js';
import { mergeNotificationPrefs } from '../../utils/notificationPrefs.js';
import { signAccessToken } from '../../utils/token.js';
import { setConsentForUser, toPrivacyConsent } from '../consent/service.js';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000;
const dummyHash = bcrypt.hashSync('timing-only-secret', BCRYPT_ROUNDS);

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function toPublicUser(user) {
  const theme = user.uiTheme;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    createdAt: user.createdAt,
    uiTheme: theme === 'light' || theme === 'dark' ? theme : 'system',
    notificationPrefs: mergeNotificationPrefs(user.notificationPrefs),
    privacyConsent: toPrivacyConsent(user.privacyConsent),
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
  const user = await User.findOne({ email: { $eq: String(input.email) } }).select('+passwordHash');

  if (user && !user.passwordHash) {
    throw new HttpError(401, 'Ovaj račun koristi Google prijavu.', {
      code: 'GOOGLE_ONLY',
    });
  }

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

/**
 * Verify Google ID token and login / create account.
 * @param {{ idToken: string, intent?: 'login' | 'register' }} input
 */
export async function loginWithGoogle(input) {
  const { OAuth2Client } = await import('google-auth-library');
  const audiences = env.googleClientIds || [];
  if (!audiences.length) {
    throw new HttpError(503, 'Google prijava nije konfigurirana.', {
      code: 'GOOGLE_NOT_CONFIGURED',
    });
  }

  const client = new OAuth2Client();
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: input.idToken,
      audience: audiences,
    });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, 'Google prijava nije uspjela.', { code: 'GOOGLE_INVALID' });
  }

  const googleId = payload?.sub;
  const email = String(payload?.email || '').trim().toLowerCase();
  const emailVerified = Boolean(payload?.email_verified);
  const name = String(payload?.name || email.split('@')[0] || 'Korisnik').trim();

  if (!googleId || !email || !emailVerified) {
    throw new HttpError(401, 'Google račun nije potvrđen.', { code: 'GOOGLE_INVALID' });
  }

  let user = await User.findOne({ googleId });
  let created = false;

  if (!user) {
    // Do not attach Google to an existing password account — prevents
    // register-then-wait takeover of someone else's Google email.
    user = await User.findOne({ email: { $eq: email } }).select('+passwordHash');
    if (user?.passwordHash) {
      throw new HttpError(409, 'Račun s ovom e-poštom već postoji. Prijavite se lozinkom.', {
        code: 'EMAIL_TAKEN',
      });
    }
    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        throw new HttpError(409, 'Račun je već povezan s drugim Google profilom.', {
          code: 'GOOGLE_MISMATCH',
        });
      }
      user.googleId = googleId;
      if (!user.name) user.name = name;
      await user.save();
    }
  }

  if (!user) {
    const intent = input.intent === 'register' ? 'register' : 'login';
    const role = intent === 'register' ? 'BUSINESS_OWNER' : 'CUSTOMER';
    try {
      user = await User.create({
        name,
        email,
        googleId,
        role,
      });
      created = true;
    } catch (error) {
      if (error?.code === 11000) {
        throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });
      }
      throw error;
    }
  }

  trackUsage({
    type: created ? 'register_success' : 'login_success',
    userId: user._id,
    role: user.role,
    path: input.intent === 'register' ? '/register' : '/login',
  });

  return {
    user: toPublicUser(user),
    token: signAccessToken(user),
    created,
  };
}

export async function updateMe(user, input) {
  if (input.email && input.email !== user.email) {
    const taken = await User.exists({
      email: { $eq: String(input.email) },
      _id: { $ne: user._id },
    });
    if (taken) throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });
    user.email = String(input.email);
  }
  if (input.name) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone || undefined;
  if (input.uiTheme !== undefined) user.uiTheme = input.uiTheme;
  if (input.notificationPrefs) {
    user.notificationPrefs = {
      ...mergeNotificationPrefs(user.notificationPrefs),
      ...input.notificationPrefs,
    };
  }
  if (input.privacyConsent) {
    await setConsentForUser(user, input.privacyConsent);
    return toPublicUser(user);
  }
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
  current.tokenVersion = Number(current.tokenVersion || 0) + 1;
  await current.save();
  return { ok: true, token: signAccessToken(current) };
}

/** Invalidate all existing access tokens for this user. */
export async function revokeAccessTokens(user) {
  const current = await User.findById(user._id);
  if (!current) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
  current.tokenVersion = Number(current.tokenVersion || 0) + 1;
  await current.save();
  return { ok: true };
}

/** Always returns the same message so emails are not enumerable. */
export async function requestPasswordReset(input) {
  const ok = {
    ok: true,
    message: 'Ako račun postoji, poslali smo link za oporavak lozinke.',
  };

  const user = await User.findOne({ email: { $eq: String(input.email) } })
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
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const updated = await User.findOneAndUpdate(
    {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    },
    {
      $set: { passwordHash },
      $inc: { tokenVersion: 1 },
      $unset: { passwordResetTokenHash: 1, passwordResetExpires: 1 },
    },
    { new: true },
  );

  if (!updated) {
    throw new HttpError(400, 'Reset link is invalid or expired', { code: 'RESET_INVALID' });
  }

  return { ok: true };
}
