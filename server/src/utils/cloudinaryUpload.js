import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

export function cloudinaryReady() {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  return Boolean(cloudName && apiKey && apiSecret);
}

/**
 * @param {Buffer} buffer
 * @param {{ folder: string, resourceType: 'image' | 'video', timeoutMs?: number }} options
 */
export function uploadBufferToCloudinary(buffer, {
  folder,
  resourceType,
  timeoutMs,
}) {
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(timeoutMs ? { timeout: timeoutMs } : {}),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

/**
 * @param {{ buffer: Buffer, mimetype: string }} file
 * @param {{ tenantId: string, subdir?: string, extension: string }} options
 */
export async function storeLocalUpload(file, { tenantId, subdir = '', extension }) {
  const safeId = String(tenantId).replace(/[^a-f\d]/gi, '');
  const filename = `${randomBytes(12).toString('hex')}.${extension}`;
  const dir = path.resolve(process.cwd(), 'uploads', safeId, ...(subdir ? [subdir] : []));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), file.buffer);
  const suffix = subdir ? `${safeId}/${subdir}/${filename}` : `${safeId}/${filename}`;
  return `/uploads/${suffix}`;
}
