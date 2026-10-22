import { api } from './api.js';

export const pushApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPushConfig: build.query({
      query: () => '/push/vapid-public-key',
    }),
    listPushSubscriptions: build.query({
      query: () => '/push/subscriptions',
      providesTags: ['Push'],
    }),
  }),
});

export const {
  useGetPushConfigQuery,
  useListPushSubscriptionsQuery,
} = pushApi;
