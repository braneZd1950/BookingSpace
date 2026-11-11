import { getApiBaseUrl } from './config.js';
import { clearToken, getToken } from './token.js';

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status ?? 0;
    this.code = code || null;
    this.data = data ?? null;
  }
}

function buildUrl(path, params) {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${cleanPath}`);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

/**
 * Niski HTTP sloj prema postojećem backendu.
 * @param {string} path - npr. '/auth/login'
 * @param {{ method?: string, body?: object, params?: object, auth?: boolean, headers?: Record<string,string> }} [options]
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    params,
    auth = true,
    headers: extraHeaders = {},
  } = options;

  const headers = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  let hadToken = false;
  if (auth !== false) {
    const token = await getToken();
    if (token) {
      hadToken = true;
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const init = { method, headers };
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, params), init);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const code = data?.code || data?.error?.code || null;
    const message = data?.message || data?.error?.message || `HTTP ${response.status}`;

    // Mrtav JWT — očisti lokalni token (isti obrazac kao web api.js)
    if (response.status === 401 && hadToken && code !== 'INVALID_CREDENTIALS') {
      await clearToken();
    }

    throw new ApiError(message, { status: response.status, code, data });
  }

  return data;
}

export const http = {
  get: (path, opts) => apiRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => apiRequest(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => apiRequest(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => apiRequest(path, { ...opts, method: 'PUT', body }),
  delete: (path, body, opts) => apiRequest(path, { ...opts, method: 'DELETE', body }),
};
