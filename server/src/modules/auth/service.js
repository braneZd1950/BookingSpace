import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import env from '../../config/env.js';
import { trackUsage } from '../../utils/analytics.js';
import { HttpError } from '../../utils/httpError.js';
import {
  sendEmailChangeConfirmEmail,
  sendPasswordResetEmail,
} from '../../utils/mail.js';
import { mergeNotificationPrefs } from '../../utils/notificationPrefs.js';
import { signAccessToken } from '../../utils/token.js';
import { setConsentForUser, toPrivacyConsent } from '../consent/service.js';
import Booking from '../../models/Booking.js';
import Membership from '../../models/Membership.js';

const BCRYPT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000;
/** Random hash for timing-safe bcrypt.compare when the user row is missing. */
const dummyHash = bcrypt.hashSync(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function assertNotDeleted(user) {
  if (user?.deletedAt) {
    throw new HttpError(401, 'Account is deleted', { code: 'ACCOUNT_DELETED' });
  }
}

export function toPublicUser(user, { hasPassword } = {}) {
  const theme = user.uiTheme;
  const pending = user.pendingEmail || null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    createdAt: user.createdAt,
    emailVerified: Boolean(user.emailVerifiedAt),
    emailVerifiedAt: user.emailVerifiedAt || null,
    pendingEmail: pending,
    hasPassword: hasPassword == null ? undefined : Boolean(hasPassword),
    hasGoogle: Boolean(user.googleId),
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
      emailVerifiedAt: new Date(),
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

  if (user?.deletedAt) {
    throw new HttpError(401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
  }

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

async function verifyGoogleIdToken(idToken) {
  const { OAuth2Client } = await import('google-auth-library');
  const audiences = env.googleClientIds || [];
  if (!audiences.length) {
    throw new HttpError(503, 'Google prijava nije konfigurirana.', {
      code: 'GOOGLE_NOT_CONFIGURED',
    });
  }

  const client = new OAuth2Client();
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: audiences });
    return ticket.getPayload();
  } catch {
    throw new HttpError(401, 'Google prijava nije uspjela.', { code: 'GOOGLE_INVALID' });
  }
}

function googleProfileFromPayload(payload) {
  const googleId = payload?.sub;
  const email = String(payload?.email || '').trim().toLowerCase();
  const emailVerified = Boolean(payload?.email_verified);
  const name = String(payload?.name || email.split('@')[0] || 'Korisnik').trim();
  if (!googleId || !email || !emailVerified) {
    throw new HttpError(401, 'Google račun nije potvrđen.', { code: 'GOOGLE_INVALID' });
  }
  return { googleId, email, name };
}

async function linkGoogleToExistingEmail({ googleId, email, name }) {
  // Do not attach Google to an existing password account — prevents
  // register-then-wait takeover of someone else's Google email.
  const user = await User.findOne({ email: { $eq: email } }).select('+passwordHash');
  if (!user) return null;
  if (user.passwordHash) {
    throw new HttpError(409, 'Račun s ovom e-poštom već postoji. Prijavite se lozinkom.', {
      code: 'EMAIL_TAKEN',
    });
  }
  if (user.googleId && user.googleId !== googleId) {
    throw new HttpError(409, 'Račun je već povezan s drugim Google profilom.', {
      code: 'GOOGLE_MISMATCH',
    });
  }
  if (user.deletedAt) {
    throw new HttpError(401, 'Account is deleted', { code: 'ACCOUNT_DELETED' });
  }
  user.googleId = googleId;
  if (!user.name) user.name = name;
  if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
  await user.save();
  return user;
}

async function createGoogleUser({ googleId, email, name, intent }) {
  const role = intent === 'register' ? 'BUSINESS_OWNER' : 'CUSTOMER';
  try {
    return await User.create({
      name,
      email,
      googleId,
      role,
      emailVerifiedAt: new Date(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });
    }
    throw error;
  }
}

/**
 * Verify Google ID token and login / create account.
 * @param {{ idToken: string, intent?: 'login' | 'register' }} input
 */
export async function loginWithGoogle(input) {
  const profile = googleProfileFromPayload(await verifyGoogleIdToken(input.idToken));
  let user = await User.findOne({ googleId: profile.googleId });
  let created = false;

  if (!user) {
    user = await linkGoogleToExistingEmail(profile);
  }
  if (!user) {
    user = await createGoogleUser({
      ...profile,
      intent: input.intent === 'register' ? 'register' : 'login',
    });
    created = true;
  }

  assertNotDeleted(user);
  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    await user.save();
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

async function startEmailChange(user, nextEmail) {
  const email = String(nextEmail).trim().toLowerCase();
  if (!email || email === user.email) return null;

  const taken = await User.exists({
    email: { $eq: email },
    _id: { $ne: user._id },
  });
  if (taken) throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });

  const fresh = await User.findById(user._id)
    .select('+pendingEmail +emailChangeTokenHash +emailChangeExpires');
  if (!fresh) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  const token = randomBytes(32).toString('hex');
  fresh.pendingEmail = email;
  fresh.emailChangeTokenHash = hashResetToken(token);
  fresh.emailChangeExpires = new Date(Date.now() + RESET_TTL_MS);
  await fresh.save();

  const origin = env.clientOrigin.replace(/\/$/, '');
  const confirmUrl = `${origin}/potvrda-emaila?token=${encodeURIComponent(token)}`;
  try {
    await sendEmailChangeConfirmEmail({
      to: email,
      memberName: fresh.name,
      confirmUrl,
    });
  } catch (error) {
    console.error('[mail] Potvrda e-pošte nije poslana:', error?.message || error);
  }

  user.pendingEmail = email;
  return email;
}

export async function updateMe(user, input) {
  assertNotDeleted(user);
  let emailChangeStarted = false;
  if (input.email && input.email !== user.email) {
    await startEmailChange(user, input.email);
    emailChangeStarted = true;
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
  const publicUser = toPublicUser(user);
  if (emailChangeStarted) {
    publicUser.pendingEmail = String(input.email).trim().toLowerCase();
    publicUser.emailChangePending = true;
  }
  return publicUser;
}

export async function confirmEmailChange(input) {
  const tokenHash = hashResetToken(input.token);
  const user = await User.findOne({
    emailChangeTokenHash: tokenHash,
    emailChangeExpires: { $gt: new Date() },
  }).select('+pendingEmail +emailChangeTokenHash +emailChangeExpires');

  if (!user || !user.pendingEmail) {
    throw new HttpError(400, 'Email confirm link is invalid or expired', {
      code: 'EMAIL_CONFIRM_INVALID',
    });
  }

  const taken = await User.exists({
    email: { $eq: user.pendingEmail },
    _id: { $ne: user._id },
  });
  if (taken) {
    throw new HttpError(409, 'Email already registered', { code: 'EMAIL_TAKEN' });
  }

  user.email = user.pendingEmail;
  user.emailVerifiedAt = new Date();
  user.pendingEmail = undefined;
  user.emailChangeTokenHash = undefined;
  user.emailChangeExpires = undefined;
  user.tokenVersion = Number(user.tokenVersion || 0) + 1;
  await user.save();

  return {
    ok: true,
    user: toPublicUser(user),
    token: signAccessToken(user),
  };
}

export async function resendEmailChange(user) {
  const fresh = await User.findById(user._id)
    .select('+pendingEmail +emailChangeTokenHash +emailChangeExpires');
  if (!fresh?.pendingEmail) {
    throw new HttpError(400, 'No pending email change', { code: 'NO_PENDING_EMAIL' });
  }
  await startEmailChange(fresh, fresh.pendingEmail);
  return { ok: true, pendingEmail: fresh.pendingEmail };
}

export async function exportMyData(user) {
  assertNotDeleted(user);
  const [memberships, bookings] = await Promise.all([
    Membership.find({ userId: user._id })
      .select('tenantId status validFrom validUntil sessionsIncluded sessionsUsed membershipPlanId createdAt')
      .lean(),
    Booking.find({ userId: user._id })
      .select('tenantId serviceId date startTime endTime status createdAt')
      .sort({ date: -1 })
      .limit(200)
      .lean(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt || null,
      uiTheme: user.uiTheme || 'system',
      notificationPrefs: mergeNotificationPrefs(user.notificationPrefs),
      privacyConsent: toPrivacyConsent(user.privacyConsent),
    },
    memberships: memberships.map((item) => ({
      tenantId: String(item.tenantId),
      status: item.status,
      membershipPlanId: item.membershipPlanId ? String(item.membershipPlanId) : null,
      validFrom: item.validFrom || null,
      validUntil: item.validUntil || null,
      sessionsIncluded: item.sessionsIncluded ?? null,
      sessionsUsed: item.sessionsUsed ?? null,
      createdAt: item.createdAt,
    })),
    bookings: bookings.map((item) => ({
      tenantId: String(item.tenantId),
      serviceId: item.serviceId ? String(item.serviceId) : null,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status,
      createdAt: item.createdAt,
    })),
  };
}

export async function deleteMyAccount(user, input = {}) {
  assertNotDeleted(user);
  const fresh = await User.findById(user._id).select('+passwordHash');
  if (!fresh) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });

  if (fresh.passwordHash) {
    const passwordOk = await bcrypt.compare(
      String(input.password || ''),
      fresh.passwordHash || dummyHash,
    );
    if (!passwordOk) {
      throw new HttpError(401, 'Current password is incorrect', {
        code: 'INVALID_CREDENTIALS',
      });
    }
  } else if (String(input.confirm || '').toUpperCase() !== 'DELETE') {
    throw new HttpError(400, 'Type DELETE to confirm account deletion', {
      code: 'DELETE_CONFIRM_REQUIRED',
    });
  }

  const stamp = Date.now();
  fresh.name = 'Deleted user';
  fresh.email = `deleted+${fresh._id}.${stamp}@invalid.blizari.local`;
  fresh.phone = undefined;
  fresh.deletedAt = new Date();
  fresh.tokenVersion = Number(fresh.tokenVersion || 0) + 1;
  fresh.notificationPrefs = mergeNotificationPrefs({
    bookingEmail: false,
    cancelEmail: false,
    memberEmail: false,
    marketing: false,
    marketingStudio: false,
    marketingPlatform: false,
  });
  fresh.set('googleId', undefined);
  fresh.set('passwordHash', undefined);
  fresh.set('pendingEmail', undefined);
  fresh.set('emailChangeTokenHash', undefined);
  fresh.set('emailChangeExpires', undefined);
  fresh.set('passwordResetTokenHash', undefined);
  fresh.set('passwordResetExpires', undefined);
  await fresh.save();
  return { ok: true };
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
  const user = await User.findOne({ email: { $eq: String(input.email) } })
    .select('+passwordResetTokenHash +passwordResetExpires');

  if (user) {
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
  }

  return {
    ok: true,
    message: 'Ako račun postoji, poslali smo link za oporavak lozinke.',
  };
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
