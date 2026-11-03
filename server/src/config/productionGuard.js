/**
 * Production readiness checks. Development / test stay permissive for localhost.
 * Failures throw; warnings are returned for logging.
 */

function isLocalhostUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return url.hostname === 'localhost'
      || url.hostname === '127.0.0.1'
      || url.hostname === '0.0.0.0'
      || url.hostname.endsWith('.local');
  } catch {
    return true;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(String(value || '')).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * @param {import('./env.js').default | Record<string, unknown>} env
 * @returns {{ ok: true, warnings: string[] } | never}
 */
export function assertProductionReady(env) {
  if (env.nodeEnv !== 'production') {
    return { ok: true, warnings: [] };
  }

  const errors = [];
  const warnings = [];

  const jwtSecret = String(env.jwtSecret || '');
  if (jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters in production');
  }
  if (/^(change-me|secret|jwt|test|dev)/i.test(jwtSecret)) {
    errors.push('JWT_SECRET looks like a placeholder — generate a strong secret');
  }

  if (!env.exportSealSecret) {
    errors.push('EXPORT_SEAL_SECRET is required in production (do not reuse JWT_SECRET)');
  } else if (env.exportSealSecret === env.jwtSecret) {
    errors.push('EXPORT_SEAL_SECRET must differ from JWT_SECRET');
  }

  const origins = Array.isArray(env.clientOrigins) ? env.clientOrigins : [env.clientOrigin];
  const listed = origins.filter(Boolean);
  if (!listed.length) {
    errors.push('CLIENT_ORIGIN is required in production (https://your-app.onrender.com)');
  }
  for (const origin of listed) {
    if (isLocalhostUrl(origin)) {
      errors.push(`CLIENT_ORIGIN(S) must not be localhost in production (${origin})`);
    } else if (!isHttpsUrl(origin)) {
      errors.push(`CLIENT_ORIGIN(S) must use https in production (${origin})`);
    }
  }

  if (env.adminEmailBootstrap === true) {
    errors.push('ADMIN_EMAIL_BOOTSTRAP=true is not allowed in production — use DB role ADMIN');
  }
  if (Array.isArray(env.adminEmails) && env.adminEmails.length) {
    warnings.push(
      'ADMIN_EMAILS is set but ignored in production unless ADMIN_EMAIL_BOOTSTRAP=true (which is blocked). Prefer promote-super-admin.js',
    );
  }

  const smtp = env.smtp || {};
  if (!smtp.host || !smtp.user || !smtp.pass || !smtp.from) {
    warnings.push('SMTP is incomplete — invites, password reset, and booking mail will not deliver');
  }

  const cloud = env.cloudinary || {};
  if (!cloud.cloudName || !cloud.apiKey || !cloud.apiSecret) {
    warnings.push('Cloudinary is not configured — local /uploads fallback is weaker for media');
  }

  const vapid = env.vapid || {};
  if (!vapid.publicKey || !vapid.privateKey) {
    warnings.push('VAPID keys missing — web push notifications disabled');
  }

  if (errors.length) {
    const message = [
      'Production environment is not ready:',
      ...errors.map((item) => `  - ${item}`),
      warnings.length ? 'Warnings:' : null,
      ...warnings.map((item) => `  - ${item}`),
    ].filter(Boolean).join('\n');
    throw new Error(message);
  }

  return { ok: true, warnings };
}
