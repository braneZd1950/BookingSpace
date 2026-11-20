import { api } from './api.js';

const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Analytics'],
    }),
    googleAuth: build.mutation({
      query: (body) => ({
        url: '/auth/google',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Analytics', 'Me', 'MyTenants', 'MyMemberships'],
    }),
    register: build.mutation({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Analytics'],
    }),
    createTenant: build.mutation({
      query: (body) => ({
        url: '/tenants',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['MyTenants', 'Analytics'],
    }),
    getMe: build.query({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),
    updateMe: build.mutation({
      query: (body) => ({
        url: '/auth/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Me'],
    }),
    changePassword: build.mutation({
      query: (body) => ({
        url: '/auth/password',
        method: 'PATCH',
        body,
      }),
    }),
    forgotPassword: build.mutation({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: build.mutation({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    confirmEmailChange: build.mutation({
      query: (body) => ({
        url: '/auth/email/confirm',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Me'],
    }),
    resendEmailChange: build.mutation({
      query: () => ({
        url: '/auth/email/resend',
        method: 'POST',
      }),
      invalidatesTags: ['Me'],
    }),
    logoutAll: build.mutation({
      query: () => ({
        url: '/auth/logout-all',
        method: 'POST',
      }),
    }),
    exportMyData: build.query({
      query: () => '/auth/me/export',
    }),
    deleteMyAccount: build.mutation({
      query: (body) => ({
        url: '/auth/me/delete',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Me'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGoogleAuthMutation,
  useRegisterMutation,
  useCreateTenantMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useConfirmEmailChangeMutation,
  useResendEmailChangeMutation,
  useLogoutAllMutation,
  useLazyExportMyDataQuery,
  useDeleteMyAccountMutation,
} = authApi;
