import { api } from '../api/api.js';
import { revokeServerSession } from './revokeSession.js';
import { STUDIO_KEY } from './studio.js';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

/**
 * Single logout path: revoke JWT, clear local keys, wipe RTK cache.
 * @param {{ dispatch?: Function, revoke?: boolean }} [options]
 */
export async function clearSession({ dispatch, revoke = true } = {}) {
  if (revoke) await revokeServerSession();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(STUDIO_KEY);
  window.dispatchEvent(new Event('studio-changed'));
  if (dispatch) dispatch(api.util.resetApiState());
}
