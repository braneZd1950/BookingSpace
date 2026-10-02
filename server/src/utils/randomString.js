import { randomBytes } from 'crypto';

export function randomString(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}
