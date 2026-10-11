import { api } from './api.js';

const serviceApi = api.injectEndpoints({
  endpoints: (build) => ({
    listServices: build.query({
      query: (tenantId) => `/tenants/${tenantId}/services`,
      providesTags: ['Services'],
    }),
    createService: build.mutation({
      query: ({ tenantId, body }) => ({
        url: `/tenants/${tenantId}/services`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Services'],
    }),
  }),
});

export const { useListServicesQuery, useCreateServiceMutation } = serviceApi;
