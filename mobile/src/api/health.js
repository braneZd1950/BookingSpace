import { http } from './http.js';

/** GET /health — bez auth. */
export function getHealth() {
  return http.get('/health', { auth: false });
}
