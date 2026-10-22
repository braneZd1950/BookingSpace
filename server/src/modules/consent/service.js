import ConsentEvent from '../../models/ConsentEvent.js';
import User from '../../models/User.js';
import { HttpError } from '../../utils/httpError.js';
import { CONSENT_VERSION } from './schema.js';

export function toPrivacyConsent(consent) {
  const raw = consent?.toObject?.() || consent || {};
  return {
    accepted: Boolean(raw.accepted),
    version: raw.version || '',
    acceptedAt: raw.acceptedAt || null,
    withdrawnAt: raw.withdrawnAt || null,
    source: raw.source || null,
    currentVersion: CONSENT_VERSION,
    isCurrent: Boolean(raw.accepted) && raw.version === CONSENT_VERSION,
  };
}

export function assertPrivacyConsent(user) {
  const consent = toPrivacyConsent(user?.privacyConsent);
  if (consent.isCurrent) return;
  throw new HttpError(
    403,
    'Privacy consent required for this action',
    { code: 'CONSENT_REQUIRED' },
  );
}

export async function applyPrivacyConsent(user, { action, version, source }) {
  const nextVersion = version || CONSENT_VERSION;
  const now = new Date();

  if (action === 'accept') {
    user.privacyConsent = {
      accepted: true,
      version: nextVersion,
      acceptedAt: now,
      withdrawnAt: null,
      source: source || 'banner',
    };
  } else {
    user.privacyConsent = {
      accepted: false,
      version: user.privacyConsent?.version || nextVersion,
      acceptedAt: user.privacyConsent?.acceptedAt || null,
      withdrawnAt: now,
      source: source || 'settings',
    };
  }

  await user.save();
  return toPrivacyConsent(user.privacyConsent);
}

export async function recordConsentEvent({
  userId,
  anonymousKey,
  action,
  version,
  source,
  path,
}) {
  if (!userId && !anonymousKey) {
    throw new HttpError(400, 'Consent subject required', { code: 'CONSENT_SUBJECT' });
  }

  await ConsentEvent.create({
    userId: userId || undefined,
    anonymousKey: anonymousKey || undefined,
    action,
    version: version || CONSENT_VERSION,
    source: source || 'banner',
    path: path || undefined,
  });
}

export async function setConsentForUser(user, input) {
  const consent = await applyPrivacyConsent(user, input);
  await recordConsentEvent({
    userId: user._id,
    action: input.action,
    version: input.version || CONSENT_VERSION,
    source: input.source,
    path: input.path,
  });
  return consent;
}

export async function setConsentPublic(user, input) {
  let consent = null;
  if (user) {
    const fresh = await User.findById(user._id);
    if (!fresh) throw new HttpError(404, 'Not found', { code: 'NOT_FOUND' });
    consent = await applyPrivacyConsent(fresh, input);
    await recordConsentEvent({
      userId: fresh._id,
      anonymousKey: input.anonymousKey,
      action: input.action,
      version: input.version || CONSENT_VERSION,
      source: input.source,
      path: input.path,
    });
  } else {
    await recordConsentEvent({
      anonymousKey: input.anonymousKey,
      action: input.action,
      version: input.version || CONSENT_VERSION,
      source: input.source,
      path: input.path,
    });
  }
  return {
    consent: consent || {
      accepted: input.action === 'accept',
      version: input.version || CONSENT_VERSION,
      acceptedAt: input.action === 'accept' ? new Date() : null,
      withdrawnAt: input.action === 'withdraw' ? new Date() : null,
      source: input.source || 'banner',
      currentVersion: CONSENT_VERSION,
      isCurrent: input.action === 'accept',
    },
  };
}
