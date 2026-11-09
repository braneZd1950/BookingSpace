import { api } from '../api/api.js';
import { retainLocalConsentAfterLogout } from './consent.js';
import { revokeServerSession } from './revokeSession.js';
import { STUDIO_KEY } from './studio.js';
import { applyPublicLightTheme } from './uiTheme.js';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

/**
 * Single logout path: revoke JWT, clear auth keys, wipe RTK cache.
 * Keeps `bookingspace.uiTheme` for the next login, but forces light chrome
 * so landing/public pages never stay dark after logout.
 * Keeps local privacy accept so the banner does not reappear after logout;
 * blocks guest→account sync so the next login is not auto-accepted.
 * @param {{ dispatch?: Function, revoke?: boolean }} [options]
 */
export async function clearSession({ dispatch, revoke = true } = {}) {
  if (revoke) await revokeServerSession();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(STUDIO_KEY);
  retainLocalConsentAfterLogout();
  applyPublicLightTheme();
  window.dispatchEvent(new Event('studio-changed'));
  if (dispatch) dispatch(api.util.resetApiState());
}
