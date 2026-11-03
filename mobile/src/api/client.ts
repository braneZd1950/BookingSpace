import { env } from '../config/env';
import { deleteItem, getItem } from '../lib/storage';

const TOKEN_KEY = 'anyminutes.token';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  auth?: boolean;
};

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

/** AuthContext registers this so a revoked JWT clears local session. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token, auth = true }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  let bearer = token;
  if (auth && bearer === undefined) {
    bearer = await getItem(TOKEN_KEY);
  }
  if (bearer) {
    headers.Authorization = `Bearer ${bearer}`;
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path.startsWith('/') ? path : `/${path}`}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Mreža nije dostupna. Provjerite vezu i pokušajte ponovo.', 0, 'NETWORK');
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const payload = data as { message?: string; error?: { message?: string; code?: string }; code?: string } | null;
    const message = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    const code = payload?.error?.code || payload?.code;
    // Wrong current password is 401 INVALID_CREDENTIALS — must not wipe the session.
    if (response.status === 401 && auth && code !== 'INVALID_CREDENTIALS') {
      await deleteItem(TOKEN_KEY);
      onUnauthorized?.();
    }
    throw new ApiError(message, response.status, code);
  }

  return data as T;
}
