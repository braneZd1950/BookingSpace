import { signJwt, verifyJwt } from './jwt.js';
import { HttpError } from './httpError.js';

const MEDIA_TTL = '20m';

export function signMediaAccessToken({ userId, tenantId, workoutId }) {
  return signJwt(
    {
      typ: 'media',
      sub: String(userId),
      tenantId: String(tenantId),
      workoutId: String(workoutId),
    },
    { expiresIn: MEDIA_TTL },
  );
}

export function verifyMediaAccessToken(token) {
  return verifyJwt(token, (payload) => {
    if (payload?.typ !== 'media' || !payload.sub || !payload.tenantId || !payload.workoutId) {
      throw new HttpError(401, 'Unauthorized');
    }
    return payload;
  });
}
