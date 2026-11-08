import fs from 'fs';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { randomBytes } from 'crypto';

/** Sonar S5693 baseline — callers may raise for authenticated video via disk storage. */
const DEFAULT_MEMORY_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Memory multer for small Cloudinary / buffer processing (images).
 * @param {{ fileSize?: number, files?: number, fields?: number, fieldSize?: number }} limits
 */
export function createMemoryUploader(limits = {}) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      files: 1,
      fileSize: DEFAULT_MEMORY_FILE_SIZE,
      ...limits,
    },
  });
}

/**
 * Disk-backed multer for large authenticated uploads (videos).
 * Avoids buffering the whole file in RAM.
 * @param {{ fileSize: number, files?: number, fields?: number, fieldSize?: number }} limits
 */
export function createDiskUploader(limits) {
  const dest = path.join(os.tmpdir(), 'bookingspace-uploads');
  fs.mkdirSync(dest, { recursive: true });

  return multer({
    storage: multer.diskStorage({
      destination: dest,
      filename(_req, file, cb) {
        const ext = path.extname(file.originalname || '').slice(0, 12);
        cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`);
      },
    }),
    limits: {
      files: 1,
      fileSize: limits.fileSize,
      fields: limits.fields,
      fieldSize: limits.fieldSize,
    },
  });
}

/** Best-effort cleanup for disk uploads after the handler finishes. */
export async function cleanupUploadFile(file) {
  const diskPath = file?.path;
  if (!diskPath) return;
  try {
    await fs.promises.unlink(diskPath);
  } catch {
    // ignore missing/locked temp files
  }
}
