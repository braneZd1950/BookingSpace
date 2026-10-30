import { api } from './api.js';

export const platformStaffApi = api.injectEndpoints({
  endpoints: (build) => ({
    listPlatformStaff: build.query({
      query: () => '/platform/staff',
      providesTags: ['PlatformStaff'],
    }),
    createPlatformStaff: build.mutation({
      query: (body) => ({
        url: '/platform/staff',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PlatformStaff'],
    }),
    updatePlatformStaff: build.mutation({
      query: ({ staffId, body }) => ({
        url: `/platform/staff/${staffId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['PlatformStaff'],
    }),
    removePlatformStaff: build.mutation({
      query: (staffId) => ({
        url: `/platform/staff/${staffId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PlatformStaff'],
    }),
  }),
});

export const {
  useListPlatformStaffQuery,
  useCreatePlatformStaffMutation,
  useUpdatePlatformStaffMutation,
  useRemovePlatformStaffMutation,
} = platformStaffApi;
