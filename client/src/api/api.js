import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:4001/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('bookingspace.token');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
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
