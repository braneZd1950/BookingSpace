import multer from 'multer';

/**
 * Memory multer for Cloudinary / local buffer processing.
 * @param {{ fileSize: number, files?: number, fields?: number, fieldSize?: number }} limits
 */
export function createMemoryUploader(limits) {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      files: 1,
      ...limits,
    },
  });
}
