import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCurrentUser, 
  loginUser, 
  logoutUser, 
  clearError as clearAuthError,
  resetAuth 
} from '../features/auth/authSlice';
import { setGlobalLoading } from '../redux/slices/uiSlice';
import { addNotification } from '../redux/slices/notificationSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);

  const login = useCallback(async (credentials) => {
    try {
      dispatch(setGlobalLoading(true));
      const result = await dispatch(loginUser(credentials)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: `Welcome back, ${result.name || result.email}!`
      }));
      return result;
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Login failed'
      }));
      throw error;
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      dispatch(setGlobalLoading(true));
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
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    try {
      dispatch(setGlobalLoading(true));
      return await dispatch(fetchCurrentUser()).unwrap();
    } catch (error) {
      console.error('Auth check failed:', error);
      return null;
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }, [dispatch]);

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
    loading: auth.loading,
    error: auth.error,
    login,
    logout,
    checkAuth,
    clearError,
    reset
  };
};
