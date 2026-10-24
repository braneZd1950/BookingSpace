import { api } from './api.js';

const onlineApi = api.injectEndpoints({
  endpoints: (build) => ({
    listOnlineWorkouts: build.query({
      query: (tenantId) => `/tenants/${tenantId}/online`,
      providesTags: ['OnlineWorkouts'],
    }),
    listOnlineCatalog: build.query({
      query: (tenantId) => `/tenants/${tenantId}/online/catalog`,
      providesTags: ['OnlineCatalog'],
    }),
    uploadOnlineVideo: build.mutation({
      query: ({ tenantId, file }) => {
        const body = new FormData();
        body.append('file', file);
        return {
          url: `/tenants/${tenantId}/online/upload`,
          method: 'POST',
          body,
        };
      },
    }),
    createOnlineWorkout: build.mutation({
      query: ({ tenantId, body }) => ({
        url: `/tenants/${tenantId}/online`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OnlineWorkouts', 'OnlineCatalog'],
    }),
    updateOnlineWorkout: build.mutation({
      query: ({ tenantId, workoutId, body }) => ({
        url: `/tenants/${tenantId}/online/${workoutId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['OnlineWorkouts', 'OnlineCatalog'],
    }),
    deleteOnlineWorkout: build.mutation({
      query: ({ tenantId, workoutId }) => ({
        url: `/tenants/${tenantId}/online/${workoutId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['OnlineWorkouts', 'OnlineCatalog'],
    }),
  }),
});

export const {
  useListOnlineWorkoutsQuery,
  useListOnlineCatalogQuery,
  useUploadOnlineVideoMutation,
  useCreateOnlineWorkoutMutation,
  useUpdateOnlineWorkoutMutation,
  useDeleteOnlineWorkoutMutation,
} = onlineApi;
