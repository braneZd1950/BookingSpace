import { api } from './api.js';

const membershipApi = api.injectEndpoints({
  endpoints: (build) => ({
    listMemberships: build.query({
      query: (tenantId) => `/tenants/${tenantId}/memberships`,
      providesTags: ['Memberships'],
    }),
    listPlans: build.query({
      query: (tenantId) => `/tenants/${tenantId}/membership-plans`,
      providesTags: ['Plans'],
    }),
    createPlan: build.mutation({
      query: ({ tenantId, body }) => ({
        url: `/tenants/${tenantId}/membership-plans`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Plans'],
    }),
    createMembership: build.mutation({
      query: ({ tenantId, body }) => ({
        url: `/tenants/${tenantId}/memberships`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Memberships', 'MyMemberships'],
    }),
    suspendMembership: build.mutation({
      query: (id) => ({
        url: `/memberships/${id}/suspend`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Memberships', 'MyMemberships'],
    }),
    listMyMemberships: build.query({
      query: (limit = 50) => ({
        url: '/memberships/my',
        params: { limit },
      }),
      providesTags: ['MyMemberships'],
    }),
  }),
});

export const {
  useListMembershipsQuery,
  useListPlansQuery,
  useCreatePlanMutation,
  useCreateMembershipMutation,
  useSuspendMembershipMutation,
  useListMyMembershipsQuery,
  useLazyListMyMembershipsQuery,
} = membershipApi;
