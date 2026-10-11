import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('bookingspace.token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
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
    'Analytics',
  ],
  endpoints: () => ({}),
});
