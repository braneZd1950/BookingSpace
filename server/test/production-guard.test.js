import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertProductionReady } from '../src/config/productionGuard.js';

function baseEnv(overrides = {}) {
  return {
    nodeEnv: 'production',
    jwtSecret: 'abcdefghijklmnopqrstuvwxyz012345',
    exportSealSecret: 'export-seal-secret-separate-32chars!!',
    clientOrigin: 'https://app.example.com',
    clientOrigins: ['https://app.example.com'],
    adminEmailBootstrap: false,
    adminEmails: [],
    smtp: {
      host: 'smtp.example.com',
      user: 'u',
      pass: 'p',
      from: 'anyminutes <noreply@example.com>',
    },
    cloudinary: {
      cloudName: 'demo',
      apiKey: 'key',
      apiSecret: 'secret',
    },
    vapid: {
      publicKey: 'pub',
      privateKey: 'priv',
    },
    ...overrides,
  };
}

test('productionGuard allows development without checks', () => {
  const result = assertProductionReady(baseEnv({ nodeEnv: 'development', jwtSecret: 'short' }));
  assert.equal(result.ok, true);
});

test('productionGuard rejects localhost CLIENT_ORIGIN', () => {
  assert.throws(
    () => assertProductionReady(baseEnv({
      clientOrigin: 'http://localhost:5173',
      clientOrigins: ['http://localhost:5173'],
    })),
    /localhost/,
  );
});

test('productionGuard rejects short JWT_SECRET', () => {
  assert.throws(
    () => assertProductionReady(baseEnv({ jwtSecret: 'too-short' })),
    /JWT_SECRET/,
  );
});

test('productionGuard rejects missing EXPORT_SEAL_SECRET', () => {
  assert.throws(
    () => assertProductionReady(baseEnv({ exportSealSecret: '' })),
    /EXPORT_SEAL_SECRET/,
  );
});

test('productionGuard rejects ADMIN_EMAIL_BOOTSTRAP=true', () => {
  assert.throws(
    () => assertProductionReady(baseEnv({ adminEmailBootstrap: true })),
    /ADMIN_EMAIL_BOOTSTRAP/,
  );
});

test('productionGuard passes a complete production env', () => {
  const result = assertProductionReady(baseEnv());
  assert.equal(result.ok, true);
  assert.equal(result.warnings.length, 0);
});
