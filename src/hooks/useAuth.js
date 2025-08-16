import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  resetAuth,
  initAuthListener
} from '../features/auth/authSlice';
import { addNotification } from '../redux/slices/notificationSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  const login = useCallback(async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: `Welcome, ${result.name || result.email}!`
      }));
      return result;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Login failed'
      }));
      throw error;
    } finally {
      /* no global overlay */
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Successfully logged out'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Logout failed'
      }));
    } finally {/* no overlay */}
  }, [dispatch]);

  // Legacy one-shot auth fetch removed; persistent listener handles auth state.
  const checkAuth = useCallback(async () => null, []);

  const startListener = useCallback(async () => {
    if (auth.listenerActive) return;
    try { await dispatch(initAuthListener()).unwrap(); } catch (e) { /* handled in slice */ }
  }, [dispatch, auth.listenerActive]);

  const clearError = useCallback((errorKey) => {
    dispatch(clearAuthError(errorKey));
  }, [dispatch]);

  const reset = useCallback(() => {
    dispatch(resetAuth());
  }, [dispatch]);

  return {
    user: auth.user,
    role: auth.role,
    isAuthenticated: auth.isAuthenticated,
  listenerActive: auth.listenerActive,
  initialAuthResolved: auth.initialAuthResolved,
  reauthRequired: auth.reauthRequired,
    loading: auth.loading,
    error: auth.error,
    login,
    logout,
    checkAuth,
  startListener,
    clearError,
    reset
  };
};
