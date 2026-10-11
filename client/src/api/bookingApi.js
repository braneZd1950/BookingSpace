import { api } from './api.js';

const bookingApi = api.injectEndpoints({
  endpoints: (build) => ({
    listTenantBookings: build.query({
      query: ({ tenantId, date, dateFrom, dateTo, limit = 200 }) => ({
        url: `/tenants/${tenantId}/bookings`,
        params: {
          ...(date ? { date } : {}),
          ...(dateFrom ? { dateFrom } : {}),
          ...(dateTo ? { dateTo } : {}),
          limit,
        },
      }),
      providesTags: ['Bookings'],
    }),
    getAvailability: build.query({
      query: ({ tenantId, serviceId, date }) => ({
        url: `/tenants/${tenantId}/services/${serviceId}/availability`,
        params: { date },
      }),
      providesTags: ['Availability'],
    }),
    createBooking: build.mutation({
      query: (body) => ({
        url: '/bookings',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Bookings', 'Availability', 'Memberships', 'MyBookings', 'MyMemberships'],
    }),
    cancelBooking: build.mutation({
      query: (bookingId) => ({
        url: `/bookings/${bookingId}/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Bookings', 'Availability', 'Memberships', 'MyBookings', 'MyMemberships'],
    }),
    listMyBookings: build.query({
      query: (limit = 50) => ({
        url: '/bookings/my',
        params: { limit },
      }),
      providesTags: ['MyBookings'],
    }),
  }),
});

export const {
  useListTenantBookingsQuery,
  useGetAvailabilityQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useListMyBookingsQuery,
} = bookingApi;
