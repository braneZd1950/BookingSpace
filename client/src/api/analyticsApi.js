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
      providesTags: ['Analytics'],
      keepUnusedDataFor: 15,
    }),
    getPlatformStudios: build.query({
      query: (days = 30) => `/analytics/platform/studios?days=${days}`,
      providesTags: ['Analytics'],
      keepUnusedDataFor: 15,
    }),
    getPlatformUsers: build.query({
      query: (days = 30) => `/analytics/platform/users?days=${days}`,
      providesTags: ['Analytics'],
      keepUnusedDataFor: 15,
    }),
    getPlatformActivity: build.query({
      query: ({ days = 7, type = 'actions' } = {}) => (
        `/analytics/platform/activity?days=${days}&type=${encodeURIComponent(type)}`
      ),
      providesTags: ['Analytics'],
      keepUnusedDataFor: 5,
    }),
    getPlatformReports: build.query({
      query: (days = 30) => `/analytics/platform/reports?days=${days}`,
      providesTags: ['Analytics'],
      keepUnusedDataFor: 30,
    }),
    getPlatformSystem: build.query({
      query: () => '/analytics/platform/system',
      providesTags: ['Analytics'],
      keepUnusedDataFor: 20,
    }),
    getPlatformBilling: build.query({
      query: () => '/analytics/platform/billing',
      providesTags: ['Analytics'],
      keepUnusedDataFor: 30,
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
      providesTags: ['Analytics'],
      keepUnusedDataFor: 20,
    }),
    sealPlatformExport: build.mutation({
      query: (body) => ({
        url: '/analytics/platform/exports/seal',
        method: 'POST',
        body,
      }),
    }),
    verifyPlatformExport: build.mutation({
      query: (body) => ({
        url: '/analytics/platform/exports/verify',
        method: 'POST',
        body,
      }),
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
  useSealPlatformExportMutation,
  useVerifyPlatformExportMutation,
} = analyticsApi;

/** Shared live-poll options for platform admin screens. */
export const PLATFORM_POLL = {
  overview: { refetchInterval: 20_000 },
  activity: { refetchInterval: 8_000 },
  studios: { refetchInterval: 20_000 },
  users: { refetchInterval: 20_000 },
  reports: { refetchInterval: 45_000 },
  system: { refetchInterval: 30_000 },
  billing: { refetchInterval: 45_000 },
  studio: { refetchInterval: 30_000 },
};
