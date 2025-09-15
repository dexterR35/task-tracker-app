import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";

// Import RTK Query APIs - required for RTK Query to function
import { tasksApi } from "@/features/tasks/tasksApi";
import { usersApi } from "@/features/users/usersApi";
import { reportersApi } from "@/features/reporters/reportersApi";

// Create the store with all required reducers and middleware
const store = configureStore({
  reducer: {
    auth: authReducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [reportersApi.reducerPath]: reportersApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
        ],
        ignoredActionsPaths: [
          'meta.arg',
          'payload.timestamp',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.error',
          'payload.error.details',
          'payload.error.details.originalError',
        ],
        ignoredPaths: [
          'usersApi.queries.*.error.details.originalError',
          'tasksApi.queries.*.error.details.originalError',
          'reportersApi.queries.*.error.details.originalError',
        ],
      },
    }).concat([
      usersApi.middleware,
      tasksApi.middleware,
      reportersApi.middleware,
    ]),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;