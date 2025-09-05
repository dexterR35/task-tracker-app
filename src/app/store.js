import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth";
import { currentMonthReducer } from "@/features/currentMonth";

// Import RTK Query APIs - required for RTK Query to function
import { tasksApi } from "@/features/tasks";
import { usersApi } from "@/features/users";
import { reportersApi } from "@/features/reporters";

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
      },
    }).concat([
      usersApi.middleware,
      tasksApi.middleware,
      reportersApi.middleware,
    ]),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;
