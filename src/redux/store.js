import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import notificationReducer, { addNotification } from './slices/notificationSlice';
import usersReducer from './slices/usersSlice';
import tasksReducer from './slices/tasksSlice';
import loadingReducer, { beginLoading, endLoading } from './slices/loadingSlice';

const pendingCounts = {};
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
  const result = next(action);
  const actionKey = action.type.replace(/\/(pending|fulfilled|rejected)$/, '');

  if (/\/pending$/.test(action.type)) {
    pendingCounts[actionKey] = (pendingCounts[actionKey] || 0) + 1;
    storeAPI.dispatch(beginLoading());
  } else if (/\/(fulfilled|rejected)$/.test(action.type)) {
    if (pendingCounts[actionKey]) {
      pendingCounts[actionKey] -= 1;
      if (pendingCounts[actionKey] === 0) {
        delete pendingCounts[actionKey];
        storeAPI.dispatch(endLoading());
      }
    }
  }

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
  if (store.asyncReducers[key]) {
    console.warn(`[store] Reducer for key "${key}" already exists. Skipping injection.`);
    return;
  }
  store.asyncReducers[key] = asyncReducer;
  store.replaceReducer(createReducer(store.asyncReducers));
  return store;
};

export default store;
