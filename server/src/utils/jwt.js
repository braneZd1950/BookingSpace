import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { HttpError } from './httpError.js';

/**
 * Verify a JWT with a payload assertion; always maps failures to 401.
 * @param {string} token
 * @param {(payload: object) => object} assertPayload
 */
export function verifyJwt(token, assertPayload) {
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    return assertPayload(payload);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Unauthorized');
  }
}

export function signJwt(payload, options) {
  return jwt.sign(payload, env.jwtSecret, options);
}
