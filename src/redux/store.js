import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import notificationReducer, { addNotification } from './slices/notificationSlice';
import usersReducer from './slices/usersSlice';
import tasksReducer from './slices/tasksSlice';
import loadingReducer, { beginLoading, endLoading } from './slices/loadingSlice';

// Dynamic reducer registry for hot module replacement
const staticReducers = {
  auth: authReducer,
  notifications: notificationReducer,
  users: usersReducer,
  tasks: tasksReducer,
  loading: loadingReducer,
};

function createReducer(asyncReducers = {}) {
  return combineReducers({
    ...staticReducers,
    ...asyncReducers,
  });
}

// Error notification middleware (skip if action.meta?.suppressGlobalError)
const errorNotificationMiddleware = storeAPI => next => action => {
  const result = next(action);
  if (/_rejected$/i.test(action.type) && !action.meta?.suppressGlobalError) {
    const message = action.error?.message || action.payload?.message || action.payload || 'Operation failed';
    storeAPI.dispatch(addNotification({ type: 'error', message }));
  }
  return result;
};

// Global loading middleware: counts pending async thunks (RTK lifecycle actions)
const globalLoadingMiddleware = storeAPI => next => action => {
  const isPending = /\/pending$/.test(action.type);
  const isDone = /\/(fulfilled|rejected)$/.test(action.type);
  if (isPending) storeAPI.dispatch(beginLoading());
  const result = next(action);
  if (isDone) storeAPI.dispatch(endLoading());
  return result;
};

const store = configureStore({
  reducer: createReducer(),
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['auth.user', 'notifications.items'],
      },
  }).concat(errorNotificationMiddleware, globalLoadingMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Add dynamic reducer injection capability
store.asyncReducers = {};
store.injectReducer = (key, asyncReducer) => {
  store.asyncReducers[key] = asyncReducer;
  store.replaceReducer(createReducer(store.asyncReducers));
  return store;
};

export default store;
