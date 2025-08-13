// Error registry for global error handling
const errorSlicesRegistry = [];

export function registerErrorSlice(sliceName, getError, clearError) {
  errorSlicesRegistry.push({ sliceName, getError, clearError });
}

export function getRegisteredErrorSlices() {
  return errorSlicesRegistry;
}

// Register auth slice errors
import { clearError } from '../features/auth/authSlice';

registerErrorSlice(
  'auth', 
  (state) => state.auth.error.loginUser || state.auth.error.fetchCurrentUser || state.auth.error.logoutUser,
  clearError
);
