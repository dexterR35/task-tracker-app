import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import currentMonthReducer from "../features/currentMonth/currentMonthSlice";
import { logger } from "../shared/utils/logger";

// Import RTK Query APIs - required for RTK Query to function
import { tasksApi } from "../features/tasks/tasksApi";
import { usersApi } from "../features/users/usersApi";
import { reportersApi } from "../features/reporters/reportersApi";

// Enhanced error notification middleware with better error categorization
const errorNotificationMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  
  if (/_rejected$/i.test(action.type) && !action.meta?.suppressGlobalError) {
    const error = action.error || action.payload;
    const errorMessage = error?.message || error || "Operation failed";
    const errorCode = error?.code || error?.status || 'UNKNOWN_ERROR';
    
    // Import toast functions dynamically to avoid circular dependencies
    import('../shared/utils/toast').then(({ showError, showWarning, showInfo }) => {
      // Categorize errors for better user experience
      let enhancedMessage = errorMessage;
      
      if (errorCode === 'PERMISSION_DENIED') {
        enhancedMessage = "You don't have permission to perform this action.";
        showWarning(enhancedMessage);
      } else if (errorCode === 'SERVICE_UNAVAILABLE') {
        enhancedMessage = "Service temporarily unavailable. Please try again later.";
        showWarning(enhancedMessage);
      } else if (errorCode === 'NOT_FOUND') {
        enhancedMessage = "The requested resource was not found.";
        showInfo(enhancedMessage);
      } else if (errorCode === 'month-not-generated') {
        enhancedMessage = "Please generate a month board first.";
        showInfo(enhancedMessage);
      } else {
        showError(enhancedMessage);
      }
    });
  }
  
  return result;
};

// Performance monitoring middleware - only in development
const performanceMiddleware = process.env.NODE_ENV === 'development' 
  ? (storeAPI) => (next) => (action) => {
      const startTime = performance.now();
      const result = next(action);
      const endTime = performance.now();
      
      // Log slow actions for performance monitoring
      const duration = endTime - startTime;
      if (duration > 100) { // Log actions taking more than 100ms
        logger.warn(`Slow action detected: ${action.type} took ${duration.toFixed(2)}ms`);
      }
      
      return result;
    }
  : (storeAPI) => (next) => (action) => next(action); // No-op in production

// Create the store with all required reducers and middleware
const store = configureStore({
  reducer: {
    auth: authReducer,
    currentMonth: currentMonthReducer,
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
        ignoredPaths: [
          'auth.user',
          'currentMonth.lastChecked',
          'currentMonth.lastUpdated',
          'currentMonth.startDate', // ISO string - serializable
          'currentMonth.endDate', // ISO string - serializable
          'usersApi.queries.getUsers.data',
          'usersApi.queries.getUsers.originalArgs',
          'tasksApi.queries.subscribeToMonthTasks.data',
          'tasksApi.queries.getMonthTasks.data',
          'reportersApi.queries.getReporters.data',
          'reportersApi.queries.getReporters.originalArgs',
        ],
      },
      immutableCheck: {
        ignoredPaths: ['auth.user'],
      },
    }).concat([
      // Custom middleware - order matters for proper execution
      // 1. Error notification middleware (handles rejected actions)
      errorNotificationMiddleware,
      // 2. Performance monitoring middleware (tracks action timing) - only in development
      performanceMiddleware,
      // 3. RTK Query API middleware - must be last to handle API actions
      usersApi.middleware,
      tasksApi.middleware,
      reportersApi.middleware,
    ]),
  devTools: process.env.NODE_ENV !== 'production',
});

// Add store utilities for debugging - only in development
if (process.env.NODE_ENV === 'development') {
  store.debug = {
    getState: () => store.getState(),
    dispatch: (action) => store.dispatch(action),
  };
  
  // Expose store for debugging in development
  window.__REDUX_STORE__ = store;
}

export default store;
