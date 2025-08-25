import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  clearReauth,
  checkAuthState,
  requireReauth,
} from '../../features/auth/authSlice';
import { addNotification } from '../../features/notifications/notificationSlice';
import { auth } from '../../app/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);

  /** Login */
  const login = useCallback(
    async (credentials) => {
      try {
        const result = await dispatch(loginUser(credentials)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: `Welcome, ${result.name || result.email}!`,
          })
        );
        return result;
      } catch (error) {
        dispatch(
          addNotification({
            type: 'error',
            message: error?.message || error || 'Login failed',
          })
        );
        throw error;
      }
    },
    [dispatch]
  );

  /** Logout */
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: 'Successfully logged out',
        })
      );
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error?.message || error || 'Logout failed',
        })
      );
    }
  }, [dispatch]);

  /** Handle reauthentication */
  const handleReauth = useCallback(async (password) => {
    try {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error('No authenticated user found');
      }

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Clear reauth requirement
      dispatch(clearReauth());
      
      dispatch(
        addNotification({
          type: 'success',
          message: 'Reauthentication successful',
        })
      );
      return true;
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error?.message || 'Reauthentication failed',
        })
      );
      throw error;
    }
  }, [dispatch]);

  /** Force reauthentication */
  const forceReauth = useCallback((message = 'Please sign back in to continue') => {
    dispatch(requireReauth({ message }));
  }, [dispatch]);

  /** Initialize auth state */
  const initAuth = useCallback(async () => {
    try {
      await dispatch(checkAuthState()).unwrap();
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
  }, [dispatch]);

  /** Clear specific error */
  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  /** Clear reauth requirement */
  const clearReauthRequirement = useCallback(() => {
    dispatch(clearReauth());
  }, [dispatch]);

  const reauthenticate = useCallback(async (password) => {
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('No authenticated user found');
    }

    const credential = EmailAuthProvider.credential(user.email, password);

    try {
      await reauthenticateWithCredential(user, credential);
      dispatch(
        addNotification({
          type: 'success',
          message: 'Reauthentication successful',
        })
      );
      return true;
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error?.message || 'Reauthentication failed',
        })
      );
      throw error;
    }
  }, [dispatch]);

  /** Derived helpers */
  const isReady = !authState.isLoading;

  /** Final return (memoized to avoid unnecessary rerenders) */
  return useMemo(
    () => ({
      user: authState.user,
      role: authState.user?.role,
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      reauthRequired: authState.reauthRequired,
      reauthMessage: authState.reauthMessage,
      error: authState.error,
      isReady,

      login,
      logout,
      handleReauth,
      forceReauth,
      initAuth,
      clearError,
      clearReauthRequirement,
      reauthenticate,
    }),
    [
      authState,
      isReady,
      login,
      logout,
      handleReauth,
      forceReauth,
      initAuth,
      clearError,
      clearReauthRequirement,
      reauthenticate,
    ]
  );
};
