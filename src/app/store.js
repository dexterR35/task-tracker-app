import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReduce';  // Make sure filename is correct: rootReducer.js ?

export const store = configureStore({
  reducer: rootReducer,
  // No need to add thunk middleware manually:
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
  devTools: process.env.NODE_ENV !== 'production',
});
