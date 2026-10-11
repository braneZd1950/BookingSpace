import { api } from './api.js';

const tenantApi = api.injectEndpoints({
  endpoints: (build) => ({
    updateTenant: build.mutation({
      query: ({ id, body }) => ({
        url: `/tenants/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['MyTenants', 'PublicTenant'],
    }),
    updateSite: build.mutation({
      query: ({ id, body }) => ({
        url: `/tenants/${id}/site`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['MyTenants', 'PublicTenant'],
    }),
    uploadImage: build.mutation({
      query: ({ id, file, purpose }) => {
        const body = new FormData();
        body.append('file', file);
        body.append('purpose', purpose);
        return {
          url: `/tenants/${id}/images`,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['MyTenants', 'PublicTenant'],
    }),
    myTenants: build.query({
      query: () => '/tenants/mine',
      providesTags: ['MyTenants'],
    }),
    getPublicTenant: build.query({
      query: (slug) => `/tenants/${slug}/public`,
      providesTags: (_result, _error, slug) => [{ type: 'PublicTenant', id: slug }],
    }),
  }),
});

export const {
  useUpdateTenantMutation,
  useUpdateSiteMutation,
  useUploadImageMutation,
  useLazyMyTenantsQuery,
  useMyTenantsQuery,
  useGetPublicTenantQuery,
} = tenantApi;
