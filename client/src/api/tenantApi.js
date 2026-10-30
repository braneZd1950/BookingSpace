import { api } from './api.js';

const tenantApi = api.injectEndpoints({
  endpoints: (build) => ({
    updateTenant: build.mutation({
      query: ({ id, body }) => ({
        url: `/tenants/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['MyTenants', 'PublicTenant', 'DiscoverTenants', 'Analytics'],
    }),
    updateSite: build.mutation({
      query: ({ id, body }) => ({
        url: `/tenants/${id}/site`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['MyTenants', 'PublicTenant', 'DiscoverTenants', 'Analytics'],
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
      invalidatesTags: ['MyTenants', 'PublicTenant', 'DiscoverTenants', 'Analytics'],
    }),
    removeGalleryImage: build.mutation({
      query: ({ id, publicId }) => ({
        url: `/tenants/${id}/gallery`,
        method: 'DELETE',
        body: { publicId },
      }),
      invalidatesTags: ['MyTenants', 'PublicTenant', 'DiscoverTenants', 'Analytics'],
    }),
    myTenants: build.query({
      query: () => '/tenants/mine',
      providesTags: ['MyTenants'],
    }),
    getPublicTenant: build.query({
      query: (slug) => `/tenants/${slug}/public`,
      providesTags: (_result, _error, slug) => [{ type: 'PublicTenant', id: slug }],
    }),
    discoverTenants: build.query({
      query: ({ q = '', category = 'all', limit = 60 } = {}) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category && category !== 'all') params.set('category', category);
        if (limit) params.set('limit', String(limit));
        const qs = params.toString();
        return `/tenants/discover${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['DiscoverTenants'],
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useUpdateTenantMutation,
  useUpdateSiteMutation,
  useUploadImageMutation,
  useRemoveGalleryImageMutation,
  useLazyMyTenantsQuery,
  useMyTenantsQuery,
  useGetPublicTenantQuery,
  useDiscoverTenantsQuery,
} = tenantApi;
