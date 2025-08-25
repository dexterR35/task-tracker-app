import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  clearReauth,
  requireReauth,
} from '../../features/auth/authSlice';
import { addNotification } from '../../features/notifications/notificationSlice';
import { auth } from '../../app/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';

// Hook for auth actions only (login, logout, etc.)
export const useAuthActions = () => {
  const dispatch = useDispatch();

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
    if (!user) {
      throw new Error('No authenticated user found');
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    dispatch(clearReauth());
    return true;
  }, [dispatch]);

  return {
    login,
    logout,
    handleReauth,
    forceReauth,
    clearError,
    clearReauthRequirement,
    reauthenticate,
  };
};

// Hook for auth state only (user, isAuthenticated, etc.)
export const useAuthState = () => {
  const authState = useSelector((state) => state.auth);

  // Memoized values
  const user = useMemo(() => authState.user, [authState.user]);
  const isAuthenticated = useMemo(() => authState.isAuthenticated, [authState.isAuthenticated]);
  const isLoading = useMemo(() => authState.isLoading, [authState.isLoading]);
  const isAuthChecking = useMemo(() => authState.isAuthChecking, [authState.isAuthChecking]);
  const role = useMemo(() => authState.user?.role, [authState.user?.role]);
  const reauthRequired = useMemo(() => authState.reauthRequired, [authState.reauthRequired]);
  const reauthMessage = useMemo(() => authState.reauthMessage, [authState.reauthMessage]);
  const error = useMemo(() => authState.error, [authState.error]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAuthChecking,
    role,
    reauthRequired,
    reauthMessage,
    error,
  };
};

// Full useAuth hook (for backward compatibility)
export const useAuth = () => {
  const authActions = useAuthActions();
  const authState = useAuthState();

  return {
    ...authState,
    ...authActions,
  };
};
