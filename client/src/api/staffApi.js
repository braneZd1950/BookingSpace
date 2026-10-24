import { api } from './api.js';

const staffApi = api.injectEndpoints({
  endpoints: (build) => ({
    listStaff: build.query({
      query: (tenantId) => `/tenants/${tenantId}/staff`,
      providesTags: ['Staff'],
    }),
    createStaff: build.mutation({
      query: ({ tenantId, body }) => ({
        url: `/tenants/${tenantId}/staff`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff', 'PublicTenant', 'Analytics'],
    }),
    suspendStaff: build.mutation({
      query: ({ tenantId, userId }) => ({
        url: `/tenants/${tenantId}/staff/${userId}/suspend`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Staff', 'PublicTenant', 'Analytics'],
    }),
  }),
});

export const {
  useListStaffQuery,
  useCreateStaffMutation,
  useSuspendStaffMutation,
} = staffApi;
