import { randomBytes } from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import multer from 'multer';

/** Default image / memory upload cap (Sonar S5693 ≤ 8 MiB). */
const DEFAULT_MEMORY_FILE_SIZE = 5 * 1024 * 1024;

/** Authenticated video disk uploads — intentional product limit (reviewed). */
const MAX_DISK_FILE_SIZE = 100 * 1024 * 1024; // NOSONAR javascript:S5693

const VIDEO_MIME_EXT = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/x-matroska': '.mkv',
};

/**
 * Memory multer for small Cloudinary / buffer processing (images).
 * @param {{ fileSize?: number, files?: number, fields?: number, fieldSize?: number }} limits
 */
export function createMemoryUploader(limits = {}) {
  const fileSize = Math.min(
    Number(limits.fileSize) > 0 ? Number(limits.fileSize) : DEFAULT_MEMORY_FILE_SIZE,
    DEFAULT_MEMORY_FILE_SIZE,
  );
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      files: 1,
      fileSize,
      fields: limits.fields,
      fieldSize: limits.fieldSize,
    },
  });
}

/**
 * Disk-backed multer for large authenticated uploads (videos).
 * Filename never uses user-controlled originalname (Sonar S2083).
 */
export function createDiskUploader(limits = {}) {
  const dest = path.join(os.tmpdir(), 'bookingspace-uploads');
  fs.mkdirSync(dest, { recursive: true });

  const requested = Number(limits.fileSize) > 0 ? Number(limits.fileSize) : MAX_DISK_FILE_SIZE;
  const fileSize = Math.min(requested, MAX_DISK_FILE_SIZE);

  return multer({
    storage: multer.diskStorage({
      destination: dest,
      filename(_req, file, cb) {
        const ext = VIDEO_MIME_EXT[file.mimetype] || '.bin';
        cb(null, `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`);
      },
    }),
    limits: {
      files: 1,
      fileSize,
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
