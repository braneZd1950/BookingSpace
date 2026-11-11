import { http } from './http.js';

/** GET /push/vapid-public-key (javno) */
export function getPushConfig() {
  return http.get('/push/vapid-public-key', { auth: false });
}

/** GET /push/subscriptions */
export function listPushSubscriptions() {
  return http.get('/push/subscriptions');
}

/** POST /push/subscribe — Web Push subscription objekt */
export function subscribePush(body) {
  return http.post('/push/subscribe', body);
}

/** POST /push/unsubscribe */
export function unsubscribePush(body) {
  return http.post('/push/unsubscribe', body);
}
