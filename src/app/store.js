import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";

// Import RTK Query APIs - required for RTK Query to function
import { tasksApi } from "@/features/tasks/tasksApi";
import { usersApi } from "@/features/users/usersApi";
import { reportersApi } from "@/features/reporters/reportersApi";
import { settingsApi } from "@/features/settings/settingsApi";

// Create the store with all required reducers and middleware
const store = configureStore({
  reducer: {
    auth: authReducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [reportersApi.reducerPath]: reportersApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Optimize immutableCheck for better performance
      immutableCheck: process.env.NODE_ENV === 'development' ? {
        ignoredPaths: [
          'tasksApi.queries',
          'usersApi.queries', 
          'reportersApi.queries',
          'settingsApi.queries',
          'tasksApi.mutations',
          'usersApi.mutations',
          'reportersApi.mutations',
          'settingsApi.mutations',
        ],
        // Increase warning threshold to 100ms
        warnAfter: 100,
      } : true,
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
          'settingsApi.queries.*.error.details.originalError',
          'tasksApi.queries',
          'usersApi.queries',
          'reportersApi.queries',
          'settingsApi.queries',
        ],
        // Increase warning threshold for serializable check too
        warnAfter: 100,
      },
    }).concat([
      usersApi.middleware,
      tasksApi.middleware,
      reportersApi.middleware,
      settingsApi.middleware,
    ]),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;