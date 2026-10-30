import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('base64url');
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/anyminutes-seal-test';
process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
process.env.EXPORT_SEAL_SECRET = process.env.EXPORT_SEAL_SECRET || 'test-export-seal-secret';

const {
  createExportSeal,
  verifyExportSeal,
} = await import('../src/utils/exportSeal.js');

test('export seal signs and verifies content hash', () => {
  const contentHash = 'a'.repeat(64);
  const seal = createExportSeal({
    documentId: 'AM-20260101-1200-ABC12',
    title: 'Test izvoz',
    fileStem: 'test',
    contentHash,
    user: {
      _id: '507f1f77bcf86cd799439011',
      email: 'admin@example.com',
      name: 'Super Admin',
    },
  });

  assert.equal(seal.algorithm, 'HMAC-SHA256');
  assert.equal(seal.contentHash, contentHash);
  assert.ok(seal.signature);
  assert.ok(seal.sealId.startsWith('SEAL-'));

  const ok = verifyExportSeal({
    documentId: seal.documentId,
    contentHash: seal.contentHash,
    signedAt: seal.signedAt,
    signature: seal.signature,
    signerEmail: seal.signer.email,
  });
  assert.equal(ok.valid, true);

  const bad = verifyExportSeal({
    documentId: seal.documentId,
    contentHash: 'b'.repeat(64),
    signedAt: seal.signedAt,
    signature: seal.signature,
    signerEmail: seal.signer.email,
  });
  assert.equal(bad.valid, false);
});
