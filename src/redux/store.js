import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import uiReducer from './slices/uiSlice';
import notificationReducer from './slices/notificationSlice';
import adminReducer from './slices/adminSlice';

// Dynamic reducer registry for hot module replacement
const staticReducers = {
  auth: authReducer,
  ui: uiReducer,
  notifications: notificationReducer,
  admin: adminReducer,
};

function createReducer(asyncReducers = {}) {
  return combineReducers({
    ...staticReducers,
    ...asyncReducers,
  });
}

const store = configureStore({
  reducer: createReducer(),
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['auth.user', 'notifications.items', 'admin.users', 'admin.tasks'],
      },
    }),
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
