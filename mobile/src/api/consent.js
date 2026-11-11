import { http } from './http.js';

/**
 * POST /consent
 * Auth opcionalan — pošalji token ako postoji (http default auth:true).
 */
export function recordConsent(body) {
  return http.post('/consent', body);
}
