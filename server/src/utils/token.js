import { signJwt, verifyJwt } from './jwt.js';
import { HttpError } from './httpError.js';
import env from '../config/env.js';

export function signAccessToken(user) {
  return signJwt(
    {
      sub: String(user._id),
      v: Number(user.tokenVersion || 0),
    },
    { expiresIn: env.jwtExpiresIn },
  );
}

export function verifyAccessToken(token) {
  return verifyJwt(token, (payload) => {
    // Media playback JWTs share JWT_SECRET but must never act as a session.
    if (payload?.typ === 'media') {
      throw new HttpError(401, 'Unauthorized');
    }
    return payload;
  });
}
