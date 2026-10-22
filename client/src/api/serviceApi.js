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
      invalidatesTags: ['Services', { type: 'PublicTenant' }],
    }),
    updateService: build.mutation({
      query: ({ serviceId, body }) => ({
        url: `/services/${serviceId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Services', { type: 'PublicTenant' }],
    }),
  }),
});

export const {
  useListServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
} = serviceApi;
