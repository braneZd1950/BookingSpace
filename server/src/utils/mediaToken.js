import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { HttpError } from './httpError.js';

const MEDIA_TTL = '20m';

export function signMediaAccessToken({ userId, tenantId, workoutId }) {
  return jwt.sign(
    {
      typ: 'media',
      sub: String(userId),
      tenantId: String(tenantId),
      workoutId: String(workoutId),
    },
    env.jwtSecret,
    { expiresIn: MEDIA_TTL },
  );
}

export function verifyMediaAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload?.typ !== 'media' || !payload.sub || !payload.tenantId || !payload.workoutId) {
      throw new HttpError(401, 'Unauthorized');
    }
    return payload;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Unauthorized');
  }
}
