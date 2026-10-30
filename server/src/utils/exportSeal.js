import crypto from 'crypto';
import env from '../config/env.js';

function sealSecret() {
  return blank('EXPORT_SEAL_SECRET') || env.jwtSecret;
}

function blank(name) {
  const value = process.env[name];
  if (!value || !value.trim()) return '';
  return value.trim();
}

function canonicalPayload({ documentId, contentHash, signedAt, signerEmail }) {
  return [
    'anyminutes-export-v1',
    documentId,
    contentHash,
    signedAt,
    signerEmail,
  ].join('\n');
}

export function createExportSeal({
  documentId,
  title,
  fileStem,
  contentHash,
  user,
}) {
  const signedAt = new Date().toISOString();
  const signerEmail = String(user?.email || '').trim().toLowerCase();
  const signerName = String(user?.name || '').trim();
  const payload = canonicalPayload({
    documentId,
    contentHash: String(contentHash || '').toLowerCase(),
    signedAt,
    signerEmail,
  });
  const signature = crypto
    .createHmac('sha256', sealSecret())
    .update(payload)
    .digest('hex');
  const sealId = `SEAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  return {
    sealId,
    algorithm: 'HMAC-SHA256',
    documentId,
    title: title || '',
    fileStem: fileStem || '',
    contentHash: String(contentHash || '').toLowerCase(),
    signedAt,
    signature,
    signer: {
      id: user?._id ? String(user._id) : '',
      email: signerEmail,
      name: signerName,
    },
    note: 'Digitalni pečat platforme (integritet sadržaja). Nije kvalificirani eIDAS potpis.',
  };
}

export function verifyExportSeal({
  documentId,
  contentHash,
  signedAt,
  signature,
  signerEmail,
}) {
  const payload = canonicalPayload({
    documentId,
    contentHash: String(contentHash || '').toLowerCase(),
    signedAt,
    signerEmail: String(signerEmail || '').trim().toLowerCase(),
  });
  const expected = crypto
    .createHmac('sha256', sealSecret())
    .update(payload)
    .digest('hex');
  const provided = String(signature || '').toLowerCase();
  const valid = provided.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  return {
    valid,
    algorithm: 'HMAC-SHA256',
    checkedAt: new Date().toISOString(),
  };
}
