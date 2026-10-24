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

// Root first, then server/ last so server/.env wins for MONGO/JWT/SMTP (as documented).
applyEnvFile('.env', { override: false });

const nodeEnv = (process.env.NODE_ENV || 'development').trim();
if (nodeEnv !== 'production') {
  applyEnvFile('.env.development', { override: true });
}

applyEnvFile('server/.env', { override: true });
if (nodeEnv !== 'production') {
  applyEnvFile('server/.env.development', { override: true });
}

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

const clientOrigin = optional('CLIENT_ORIGIN', 'http://localhost:5173');
const extraOrigins = blank('CLIENT_ORIGINS')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const env = {
  nodeEnv: optional('NODE_ENV', 'development'),
  port: Number(optional('PORT', '4001')),
  mongoUri: required('MONGO_URI'),
  clientOrigin,
  clientOrigins: [...new Set([
    clientOrigin,
    optional('CLIENT_ORIGIN_MOBILE', 'http://localhost:5174'),
    ...extraOrigins,
  ].filter(Boolean))],
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '7d'),
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
};

export default env;
