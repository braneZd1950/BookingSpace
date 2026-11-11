import { http } from './http.js';
import { clearToken, setToken } from './token.js';

/** POST /auth/login — sprema JWT. */
export async function login({ email, password }) {
  const data = await http.post('/auth/login', { email, password }, { auth: false });
  const token = data?.token || data?.accessToken;
  if (token) await setToken(token);
  return data;
}

/** POST /auth/google */
export async function googleAuth(body) {
  const data = await http.post('/auth/google', body, { auth: false });
  const token = data?.token || data?.accessToken;
  if (token) await setToken(token);
  return data;
}

/** POST /auth/register — sprema JWT ako stigne. */
export async function register(body) {
  const data = await http.post('/auth/register', body, { auth: false });
  const token = data?.token || data?.accessToken;
  if (token) await setToken(token);
  return data;
}

/** GET /auth/me */
export function getMe() {
  return http.get('/auth/me');
}

/** PATCH /auth/me */
export function updateMe(body) {
  return http.patch('/auth/me', body);
}

/** PATCH /auth/password */
export function changePassword(body) {
  return http.patch('/auth/password', body);
}

/** POST /auth/forgot-password */
export function forgotPassword(body) {
  return http.post('/auth/forgot-password', body, { auth: false });
}

/** POST /auth/reset-password */
export function resetPassword(body) {
  return http.post('/auth/reset-password', body, { auth: false });
}

/**
 * Odjava: pokušaj server revoke, uvijek obriši lokalni token.
 * POST /auth/logout
 */
export async function logout() {
  try {
    await http.post('/auth/logout', {});
  } catch {
    /* lokalni logout i dalje ide */
  }
  await clearToken();
}
