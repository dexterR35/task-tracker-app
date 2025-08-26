import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer, { requireReauth } from "../features/auth/authSlice";
import { tasksApi } from "../features/tasks/tasksApi";
import { usersApi } from "../features/users/usersApi";
import { logger } from "../shared/utils/logger";
import { auth } from "./firebase";

const staticReducers = {
  auth: authReducer,
  [tasksApi.reducerPath]: tasksApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
};

function createReducer(asyncReducers = {}) {
  return combineReducers({
    ...staticReducers,
    ...asyncReducers,
  });
}

// Enhanced auth middleware with better error handling
const authMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  
  // Only check for auth-related errors in rejected actions
  if (/_rejected$/i.test(action.type) && !action.meta?.suppressGlobalError) {
    const error = action.error || action.payload;
    const errorMessage = error?.message || error || "Operation failed";
    
    // Enhanced critical auth errors detection
    const criticalAuthErrors = [
      'auth/id-token-expired',
      'auth/id-token-revoked', 
      'auth/session-cookie-expired',
      'auth/session-cookie-revoked',
      'auth/user-token-expired',
      'auth/user-disabled',
      'auth/user-not-found',
      'auth/invalid-credential',
      'auth/operation-not-allowed',
      'auth/too-many-requests',
      'AUTH_REQUIRED',
      'Authentication required',
      'No authenticated user'
    ];
    
    const isCriticalAuthError = criticalAuthErrors.some(authError => 
      errorMessage.includes(authError) || 
      errorMessage.toLowerCase().includes('authentication required') ||
      errorMessage.toLowerCase().includes('no authenticated user')
    );
    
    if (isCriticalAuthError) {
      logger.warn('Critical auth error detected, requiring reauthentication:', errorMessage);
      
      // Dispatch reauth action and let Firebase auth listener handle the state changes
      storeAPI.dispatch(requireReauth({ 
        message: 'Your session has expired. Please sign in again.' 
      }));
      
      // Sign out from Firebase - the auth listener will handle the state update
      auth.signOut().catch(err => {
        logger.error('Error signing out after auth error:', err);
      });
    }
  }
  
  return result;
};

// Enhanced error notification middleware with better error categorization
const errorNotificationMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  
  if (/_rejected$/i.test(action.type) && !action.meta?.suppressGlobalError) {
    const error = action.error || action.payload;
    const errorMessage = error?.message || error || "Operation failed";
    const errorCode = error?.code || error?.status || 'UNKNOWN_ERROR';
    
    // Don't show notifications for auth errors (handled by auth middleware)
    const authErrorPatterns = [
      'auth/', 'AUTH_REQUIRED', 'Authentication required', 'No authenticated user'
    ];
    
    const isAuthError = authErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );
    
    if (!isAuthError) {
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
  }
  
  return result;
};

// Performance monitoring middleware
const performanceMiddleware = (storeAPI) => (next) => (action) => {
  const startTime = performance.now();
  const result = next(action);
  const endTime = performance.now();
  
  // Log slow actions for performance monitoring
  const duration = endTime - startTime;
  if (duration > 100) { // Log actions taking more than 100ms
    logger.warn(`Slow action detected: ${action.type} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

// Create the store with enhanced configuration
const store = configureStore({
  reducer: createReducer(),
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
          'usersApi.queries.subscribeToUsers.data',
          'usersApi.queries.getUsers.data',
          'tasksApi.queries.subscribeToMonthTasks.data',
          'tasksApi.queries.getMonthTasks.data',
        ],
      },
      immutableCheck: {
        ignoredPaths: ['auth.user'],
      },
    }).concat([
      authMiddleware,
      errorNotificationMiddleware,
      performanceMiddleware,
      tasksApi.middleware,
      usersApi.middleware,
    ]),
  devTools: process.env.NODE_ENV !== 'production',
  preloadedState: {},
});

// Add async reducer injection capability
store.asyncReducers = {};

store.injectReducer = (key, asyncReducer) => {
  if (store.asyncReducers[key]) {
    return;
  }
  
  store.asyncReducers[key] = asyncReducer;
  store.replaceReducer(createReducer(store.asyncReducers));
  
  logger.log(`Injected reducer: ${key}`);
};

// Add store utilities for debugging
if (process.env.NODE_ENV === 'development') {
  store.debug = {
    getState: () => store.getState(),
    dispatch: (action) => store.dispatch(action),
  };
  
  // Expose store for debugging in development
  window.__REDUX_STORE__ = store;
}

export default store;
