import { configureStore,combineReducers } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import notificationReducer, { addNotification } from "./slices/notificationSlice";
import { tasksApi } from "./services/tasksApi";
import { usersApi } from "./services/usersApi";
 

const staticReducers = {
  auth: authReducer,
  notifications: notificationReducer,

  [tasksApi.reducerPath]: tasksApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
};

function createReducer(asyncReducers = {}) {
  return combineReducers({
    ...staticReducers,
    ...asyncReducers,
  });
}

// Error notification middleware (no skip if action.meta?.suppressGlobalError)
const errorNotificationMiddleware = (storeAPI) => (next) => (action) => {
  const result = next(action);
  if (/_rejected$/i.test(action.type) && !action.meta?.suppressGlobalError) {
    const message =
      action.error?.message ||
      action.payload?.message ||
      action.payload ||
      "Operation failed";
    storeAPI.dispatch(addNotification({ type: "error", message }));
  }
  return result;
};

const store = configureStore({
  reducer: createReducer(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        ignoredPaths: ["auth.user", "notifications.items"],
      },
    }).concat(
      tasksApi.middleware,
      usersApi.middleware,
      errorNotificationMiddleware
    ),
  devTools: process.env.NODE_ENV !== "production",
});


store.asyncReducers = {};
store.injectReducer = (key, asyncReducer) => {
  if (store.asyncReducers[key]) {
    console.warn(
      `[store] Reducer for key "${key}" already exists. Skipping injection.`
    );
    return;
  }
  store.asyncReducers[key] = asyncReducer;
  store.replaceReducer(createReducer(store.asyncReducers));
  return store;
};

export default store;
