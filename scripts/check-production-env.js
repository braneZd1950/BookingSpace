/**
 * Validate production environment without starting Mongo / Express.
 *
 * Usage:
 *   node scripts/check-production-env.js
 *   node scripts/check-production-env.js --file .env.production
 *
 * Exits 0 when ready (warnings allowed), 1 on hard failures.
 * Local development .env is never forced to pass these checks unless
 * NODE_ENV=production (or you pass --force).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const fileFlagIndex = process.argv.indexOf('--file');
const fileArg = fileFlagIndex >= 0 ? process.argv[fileFlagIndex + 1] : null;
const force = args.has('--force');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const out = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const filePath = fileArg
  ? path.resolve(root, fileArg)
  : path.join(root, '.env.production');

const fromFile = loadEnvFile(filePath);
const merged = { ...fromFile, ...process.env };

const nodeEnv = merged.NODE_ENV || 'development';
if (nodeEnv !== 'production' && !force) {
  console.log(
    `NODE_ENV=${nodeEnv} — production checks skipped (localhost/dev OK).\n`
    + 'Use --force or set NODE_ENV=production / --file .env.production to validate launch env.',
  );
  if (!existsSync(path.join(root, '.env.production.example'))) {
    console.warn('Missing .env.production.example template.');
  } else {
    console.log('Template ready: .env.production.example');
  }
  process.exit(0);
}

const { assertProductionReady } = await import(
  pathToFileURL(path.join(root, 'server', 'src', 'config', 'productionGuard.js')).href
);

const clientOrigin = merged.CLIENT_ORIGIN || '';
const extraOrigins = String(merged.CLIENT_ORIGINS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const env = {
  nodeEnv: 'production',
  jwtSecret: merged.JWT_SECRET || '',
  exportSealSecret: merged.EXPORT_SEAL_SECRET || '',
  clientOrigin,
  clientOrigins: [...new Set([
    clientOrigin,
    merged.CLIENT_ORIGIN_MOBILE,
    ...extraOrigins,
  ].filter(Boolean))],
  adminEmailBootstrap: (() => {
    const raw = String(merged.ADMIN_EMAIL_BOOTSTRAP || '').toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  })(),
  adminEmails: String(merged.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
  smtp: {
    host: merged.SMTP_HOST || '',
    user: merged.SMTP_USER || '',
    pass: merged.SMTP_PASS || '',
    from: merged.EMAIL_FROM || merged.SMTP_FROM || '',
  },
  cloudinary: {
    cloudName: merged.CLOUDINARY_CLOUD_NAME || '',
    apiKey: merged.CLOUDINARY_API_KEY || '',
    apiSecret: merged.CLOUDINARY_API_SECRET || '',
  },
  vapid: {
    publicKey: merged.VAPID_PUBLIC_KEY || '',
    privateKey: merged.VAPID_PRIVATE_KEY || '',
  },
};

const missingRequired = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_ORIGIN'].filter(
  (key) => !String(merged[key] || '').trim(),
);
if (missingRequired.length) {
  console.error(`Missing required keys: ${missingRequired.join(', ')}`);
  process.exit(1);
}

if (String(merged.VITE_API_URL || '').includes('localhost')) {
  console.error('VITE_API_URL must be the public HTTPS API URL for production builds (not localhost).');
  process.exit(1);
}

try {
  const result = assertProductionReady(env);
  for (const warning of result.warnings) {
    console.warn(`WARN  ${warning}`);
  }
  console.log('OK    Production environment checks passed');
  if (fileArg || existsSync(filePath)) {
    console.log(`File  ${fileArg || '.env.production'}`);
  }
  process.exit(0);
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
