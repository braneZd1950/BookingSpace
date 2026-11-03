import { HttpError } from './httpError.js';

/** Minimal magic-byte checks so uploads cannot rely on client mimetype alone. */

export function assertImageBuffer(buffer, mimetype) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    throw new HttpError(400, 'Unsupported image type', { code: 'UNSUPPORTED_MEDIA' });
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47;
  const isWebp = buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';

  if (mimetype === 'image/jpeg' && isJpeg) return;
  if (mimetype === 'image/png' && isPng) return;
  if (mimetype === 'image/webp' && isWebp) return;

  throw new HttpError(400, 'Unsupported image type', { code: 'UNSUPPORTED_MEDIA' });
}

export function assertVideoBuffer(buffer, mimetype) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    throw new HttpError(400, 'Unsupported video type', { code: 'UNSUPPORTED_MEDIA' });
  }

  const head4 = buffer.toString('ascii', 0, 4);
  const isWebm = buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
  const isRiffAvi = head4 === 'RIFF' && buffer.toString('ascii', 8, 12) === 'AVI ';
  const isFtyp = buffer.toString('ascii', 4, 8) === 'ftyp';
  const looksBinaryVideo = isWebm || isRiffAvi || isFtyp;

  if (!looksBinaryVideo) {
    throw new HttpError(400, 'Unsupported video type', { code: 'UNSUPPORTED_MEDIA' });
  }

  if (mimetype === 'video/webm' && isWebm) return;
  if (mimetype === 'video/x-msvideo' && isRiffAvi) return;
  if (mimetype === 'video/x-matroska' && isWebm) return;
  if (mimetype === 'video/mp4' || mimetype === 'video/quicktime') {
    if (isFtyp) return;
  }

  // Accept known binary containers even if client mimetype is a close cousin.
  if (mimetype.startsWith('video/') && looksBinaryVideo) return;

  throw new HttpError(400, 'Unsupported video type', { code: 'UNSUPPORTED_MEDIA' });
}
