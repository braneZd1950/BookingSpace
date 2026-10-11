import { api } from './api.js';

const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    trackPageView: build.mutation({
      query: (body) => ({
        url: '/analytics/events',
        method: 'POST',
        body,
      }),
    }),
    getPlatformAnalytics: build.query({
      query: (days = 30) => `/analytics/platform?days=${days}`,
    }),
    getPlatformStudios: build.query({
      query: (days = 30) => `/analytics/platform/studios?days=${days}`,
    }),
    getPlatformUsers: build.query({
      query: (days = 30) => `/analytics/platform/users?days=${days}`,
    }),
    getPlatformActivity: build.query({
      query: ({ days = 7, type = 'actions' } = {}) => (
        `/analytics/platform/activity?days=${days}&type=${encodeURIComponent(type)}`
      ),
    }),
    getPlatformReports: build.query({
      query: (days = 30) => `/analytics/platform/reports?days=${days}`,
    }),
    getPlatformSystem: build.query({
      query: () => '/analytics/platform/system',
    }),
    getPlatformBilling: build.query({
      query: () => '/analytics/platform/billing',
      providesTags: ['Analytics'],
    }),
    updatePlatformBilling: build.mutation({
      query: ({ tenantId, body }) => ({
        url: `/analytics/platform/billing/${tenantId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Analytics'],
    }),
    sendBillingWarning: build.mutation({
      query: (tenantId) => ({
        url: `/analytics/platform/billing/${tenantId}/warn`,
        method: 'POST',
      }),
      invalidatesTags: ['Analytics'],
    }),
    sendBillingInvoice: build.mutation({
      query: (tenantId) => ({
        url: `/analytics/platform/billing/${tenantId}/invoice`,
        method: 'POST',
      }),
      invalidatesTags: ['Analytics'],
    }),
    getStudioAnalytics: build.query({
      query: ({ tenantId, days = 30 }) => `/analytics/tenants/${tenantId}?days=${days}`,
    }),
  }),
});

export const {
  useTrackPageViewMutation,
  useGetPlatformAnalyticsQuery,
  useGetPlatformStudiosQuery,
  useGetPlatformUsersQuery,
  useGetPlatformActivityQuery,
  useGetPlatformReportsQuery,
  useGetPlatformSystemQuery,
  useGetPlatformBillingQuery,
  useUpdatePlatformBillingMutation,
  useSendBillingWarningMutation,
  useSendBillingInvoiceMutation,
  useGetStudioAnalyticsQuery,
} = analyticsApi;
