/**
 * Redux Store Configuration
 * 
 * @fileoverview Main Redux store with RTK Query APIs and optimized middleware
 * @author Senior Developer
 * @version 2.0.0
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";

// Import RTK Query APIs - required for RTK Query to function
import { tasksApi } from "@/features/tasks/tasksApi";
import { monthsApi } from "@/features/months/monthsApi";
import { usersApi } from "@/features/users/usersApi";
import { reportersApi } from "@/features/reporters/reportersApi";
import { settingsApi } from "@/features/settings/settingsApi";

/**
 * Store configuration with optimized middleware and performance settings
 * @type {Object}
 */
const store = configureStore({
  reducer: {
    // Authentication state management
    auth: authReducer,
    
    // RTK Query API reducers
    [tasksApi.reducerPath]: tasksApi.reducer,
    [monthsApi.reducerPath]: monthsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [reportersApi.reducerPath]: reportersApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // ========================================
      // IMMUTABLE CHECK OPTIMIZATION
      // ========================================
      immutableCheck: process.env.NODE_ENV === 'development' ? {
        ignoredPaths: [
          // RTK Query cache paths (large objects, safe to ignore)
          'tasksApi.queries',
          'monthsApi.queries',
          'usersApi.queries', 
          'reportersApi.queries',
          'settingsApi.queries',
          'tasksApi.mutations',
          'monthsApi.mutations',
          'usersApi.mutations',
          'reportersApi.mutations',
          'settingsApi.mutations',
        ],
        // Increase warning threshold to 100ms for better performance
        warnAfter: 100,
      } : true,
      // ========================================
      // SERIALIZABLE CHECK OPTIMIZATION
      // ========================================
      serializableCheck: {
        // Ignore Redux Persist actions (non-serializable by design)
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'persist/FLUSH',
        ],
        // Ignore common non-serializable payload fields
        ignoredActionsPaths: [
          'meta.arg',
          'payload.timestamp',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.error',
          'payload.error.details',
          'payload.error.details.originalError',
        ],
        // Ignore RTK Query cache and error paths
        ignoredPaths: [
          // Error details (often contain non-serializable objects)
          'usersApi.queries.*.error.details.originalError',
          'tasksApi.queries.*.error.details.originalError',
          'monthsApi.queries.*.error.details.originalError',
          'reportersApi.queries.*.error.details.originalError',
          'settingsApi.queries.*.error.details.originalError',
          // RTK Query cache (large objects, safe to ignore)
          'tasksApi.queries',
          'monthsApi.queries',
          'usersApi.queries',
          'reportersApi.queries',
          'settingsApi.queries',
        ],
        // Increase warning threshold for better performance
        warnAfter: 100,
      },
    }).concat([
      // ========================================
      // RTK QUERY MIDDLEWARE
      // ========================================
      // Order matters: APIs with more dependencies should come first
      usersApi.middleware,
      tasksApi.middleware,
      monthsApi.middleware,
      reportersApi.middleware,
      settingsApi.middleware,
    ]),
  
  // ========================================
  // DEVELOPMENT TOOLS
  // ========================================
  devTools: process.env.NODE_ENV !== 'production',
});

// ========================================
// EXPORTS
// ========================================

/**
 * Main Redux store instance
 * @type {Object} - Configured Redux store
 */
export default store;

/**
 * Store type inference for TypeScript compatibility
 * @typedef {ReturnType<typeof store.getState>} RootState
 * @typedef {typeof store.dispatch} AppDispatch
 */