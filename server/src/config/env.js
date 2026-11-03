import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const initialEnv = process.env.NODE_ENV;
const presetKeys = new Set(Object.keys(process.env));

function applyEnvFile(filename, { override }) {
  const filePath = path.join(root, filename);
  if (!fs.existsSync(filePath)) return;

  const parsed = dotenv.parse(fs.readFileSync(filePath));
  for (const [key, raw] of Object.entries(parsed)) {
    const value = raw.trim();
    if (!value) continue;
    if (initialEnv === 'test' && presetKeys.has(key)) continue;
    if (!override && process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

// One local file: repo-root .env. Vite reads the same file and only exposes VITE_*.
// Render injects process env and does not use this file.
applyEnvFile('.env', { override: false });

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function optional(name, fallback) {
  const value = process.env[name];
  if (!value || !value.trim()) return fallback;
  return value.trim();
}

function blank(name) {
  const value = process.env[name];
  if (!value || !value.trim()) return '';
  return value.trim();
}

const nodeEnv = optional('NODE_ENV', 'development');
const isProd = nodeEnv === 'production';
// Local defaults only outside production — never inject localhost into Render CORS.
const clientOrigin = blank('CLIENT_ORIGIN')
  || (isProd ? '' : 'http://localhost:5173');
const mobileOrigin = blank('CLIENT_ORIGIN_MOBILE')
  || (isProd ? '' : 'http://localhost:5174');
const extraOrigins = blank('CLIENT_ORIGINS')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const env = {
  nodeEnv,
  port: Number(optional('PORT', '4001')),
  mongoUri: required('MONGO_URI'),
  clientOrigin,
  clientOrigins: [...new Set([
    clientOrigin,
    mobileOrigin,
    ...extraOrigins,
  ].filter(Boolean))],
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '24h'),
  /**
   * ADMIN_EMAILS bootstrap:
   * - true / false = force on/off
   * - unset = allowed outside production only
   */
  adminEmailBootstrap: (() => {
    const raw = blank('ADMIN_EMAIL_BOOTSTRAP').toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return false;
    return null;
  })(),
  exportSealSecret: blank('EXPORT_SEAL_SECRET'),
  cloudinary: {
    cloudName: blank('CLOUDINARY_CLOUD_NAME'),
    apiKey: blank('CLOUDINARY_API_KEY'),
    apiSecret: blank('CLOUDINARY_API_SECRET'),
  },
  smtp: {
    host: blank('SMTP_HOST'),
    port: Number(optional('SMTP_PORT', '587')),
    secure: optional('SMTP_SECURE', 'false') === 'true',
    user: blank('SMTP_USER'),
    pass: blank('SMTP_PASS'),
    from: blank('EMAIL_FROM') || blank('SMTP_FROM'),
  },
  vapid: {
    publicKey: blank('VAPID_PUBLIC_KEY'),
    privateKey: blank('VAPID_PRIVATE_KEY'),
    subject: blank('VAPID_SUBJECT') || 'mailto:kontakt@anyminutes.hr',
  },
  adminEmails: blank('ADMIN_EMAILS')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
  /**
   * Google Sign-In client IDs (Web / iOS / Android). Comma-separated.
   * At least the Web client ID is required for GIS + token verify.
   */
  googleClientIds: blank('GOOGLE_CLIENT_IDS')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .concat(blank('GOOGLE_CLIENT_ID') ? [blank('GOOGLE_CLIENT_ID')] : [])
    .filter((value, index, all) => all.indexOf(value) === index),
  /** When set, Express serves this folder (Vite `client/dist`) for the SPA. */
  clientDist: blank('CLIENT_DIST'),
  /** auto = serve if dist exists; true = require; false = API only */
  serveClient: optional('SERVE_CLIENT', 'auto'),
};

export default env;
