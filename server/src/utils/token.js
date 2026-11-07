import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { HttpError } from './httpError.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      v: Number(user.tokenVersion || 0),
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    // Media playback JWTs share JWT_SECRET but must never act as a session.
    if (payload?.typ === 'media') {
      throw new HttpError(401, 'Unauthorized');
    }
    return payload;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Unauthorized');
  }
}
