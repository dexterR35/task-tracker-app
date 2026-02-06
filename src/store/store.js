/**
 * Redux store configuration with RTK Query
 */

import { configureStore } from '@reduxjs/toolkit';
import { api } from './api';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serializability check
        ignoredActions: ['api/executeQuery/fulfilled'],
      },
    }).concat(api.middleware),
  devTools: import.meta.env.DEV,
});
