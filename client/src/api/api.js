import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { STUDIO_KEY } from '../lib/studio.js';

const TOKEN_KEY = 'bookingspace.token';
const SESSION_KEY = 'bookingspace.session';

const configuredApi = import.meta.env.VITE_API_URL;
if (import.meta.env.PROD && !configuredApi) {
  throw new Error('VITE_API_URL must be set for production builds.');
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: configuredApi || 'http://localhost:4001/api',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/** Filled after createApi — used to wipe RTK cache on 401. */
let apiRef;

/** Drop revoked/expired sessions so UI cannot keep calling with a dead JWT.
 *  Skip login/register failures (401 without an existing session token)
 *  and password-change wrong-current-password (INVALID_CREDENTIALS).
 */
async function baseQueryWithAuth(args, api, extraOptions) {
  const hadToken = Boolean(localStorage.getItem(TOKEN_KEY));
  const result = await rawBaseQuery(args, api, extraOptions);
  const code = result.error?.data?.code || result.error?.data?.error?.code;
  if (result.error?.status === 401 && hadToken && code !== 'INVALID_CREDENTIALS') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(STUDIO_KEY);
    window.dispatchEvent(new Event('studio-changed'));
    if (apiRef) {
      api.dispatch(apiRef.util.resetApiState());
    }
  }
  return result;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: [
    'Memberships',
    'MyMemberships',
    'Plans',
    'Bookings',
    'MyBookings',
    'Availability',
    'Services',
    'Me',
    'MyTenants',
    'PublicTenant',
    'DiscoverTenants',
    'Analytics',
    'Push',
    'Staff',
    'PlatformStaff',
    'OnlineWorkouts',
    'OnlineCatalog',
  ],
  endpoints: () => ({}),
});

apiRef = api;
