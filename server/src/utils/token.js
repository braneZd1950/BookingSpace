import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { HttpError } from './httpError.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id) },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Unauthorized');
  }
}
