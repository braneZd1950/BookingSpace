import env from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const STATUS_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_ERROR',
};

const normalizers = [
  normalizeHttpError,
  normalizeZodError,
  normalizeDuplicateKey,
  normalizeCastError,
  normalizeValidationError,
  normalizeJwtError,
  normalizeBadJson,
  normalizePayloadTooLarge,
  normalizeMulterError,
  normalizeStatusError,
];

function codeForStatus(status) {
  return STATUS_CODES[status] || 'INTERNAL_ERROR';
}

function clientError(status, code, message, details) {
  return {
    status,
    code: code || codeForStatus(status),
    message,
    details,
  };
}

function normalizeHttpError(error) {
  if (!(error instanceof HttpError)) return null;

  const status = Number(error.status) || 500;
  return clientError(
    status,
    error.code,
    status >= 500 ? 'Internal server error' : error.message,
    error.details,
  );
}

function normalizeZodError(error) {
  if (error?.name !== 'ZodError' || !Array.isArray(error.issues)) return null;

  const details = error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));

  return clientError(400, 'VALIDATION_ERROR', 'Validation failed', details);
}

function normalizeDuplicateKey(error) {
  if (error?.code !== 11000) return null;

  const field = Object.keys(error.keyPattern || {})[0];
  const message = field ? `${field} already exists` : 'Duplicate value';
  return clientError(409, 'DUPLICATE', message);
}

function normalizeCastError(error) {
  if (error?.name !== 'CastError') return null;
  return clientError(400, 'INVALID_ID', 'Invalid id');
}

function normalizeValidationError(error) {
  if (error?.name !== 'ValidationError' || !error.errors) return null;

  const details = Object.entries(error.errors).map(([field, item]) => ({
    field,
    message: item.message,
  }));

  return clientError(400, 'VALIDATION_ERROR', 'Validation failed', details);
}

function normalizeJwtError(error) {
  if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error?.name)) {
    return null;
  }
  return clientError(401, 'UNAUTHORIZED', 'Unauthorized');
}

function normalizeBadJson(error) {
  if (error?.type !== 'entity.parse.failed') return null;
  return clientError(400, 'INVALID_JSON', 'Invalid JSON');
}

function normalizePayloadTooLarge(error) {
  if (error?.type !== 'entity.too.large') return null;
  return clientError(413, 'PAYLOAD_TOO_LARGE', 'Payload too large');
}

function normalizeMulterError(error) {
  if (error?.name !== 'MulterError') return null;
  if (error.code === 'LIMIT_FILE_SIZE') {
    return clientError(413, 'PAYLOAD_TOO_LARGE', 'Image is too large');
  }
  return clientError(400, 'UPLOAD_ERROR', 'Upload failed');
}

function normalizeStatusError(error) {
  const status = Number(error?.status || error?.statusCode);
  if (!status || status < 400 || status > 599) return null;

  return clientError(
    status,
    typeof error.code === 'string' ? error.code : undefined,
    status >= 500 ? 'Internal server error' : error.message,
  );
}

export function normalizeError(error) {
  for (const normalize of normalizers) {
    const normalized = normalize(error);
    if (normalized) return normalized;
  }

  return clientError(500, 'INTERNAL_ERROR', 'Internal server error');
}

function logServerError(error, normalized, req) {
  if (normalized.status < 500) return;

  const entry = {
    code: normalized.code,
    name: error?.name || 'Error',
    method: req.method,
    path: req.path,
  };

  if (env.nodeEnv !== 'production') {
    entry.message = error?.message;
    entry.stack = error?.stack;
  }

  console.error(JSON.stringify(entry));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  const normalized = normalizeError(error);
  logServerError(error, normalized, req);

  const body = {
    message: normalized.message,
    code: normalized.code,
  };

  if (normalized.details) body.details = normalized.details;
  res.status(normalized.status).json(body);
}

export function notFound(req, res) {
  res.status(404).json({
    message: 'Not found',
    code: 'NOT_FOUND',
  });
}
