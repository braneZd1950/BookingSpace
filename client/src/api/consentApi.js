import { api } from './api.js';

const consentApi = api.injectEndpoints({
  endpoints: (build) => ({
    recordConsent: build.mutation({
      query: (body) => ({
        url: '/consent',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Me'],
    }),
  }),
});

export const { useRecordConsentMutation } = consentApi;
