import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  clearReauth,
  requireReauth,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectReauthRequired,
  selectReauthMessage,
  selectUserRole,
  selectIsAdmin,
  selectIsUser,
  selectUserPermissions,
  selectIsUserActive,
  selectLastLoginAttempt,
  selectCanAccessAdmin,
  selectCanAccessUser,
} from '../../features/auth/authSlice';
import { auth } from '../../app/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  showWelcomeMessage,
  showLogoutSuccess,
  showAuthError,
  showReauthSuccess,
  showReauthError,
} from '../utils/toast';

// Hook for auth actions only (login, logout, etc.)
export const useAuthActions = () => {
  const dispatch = useDispatch();

  /** Login */
  const login = useCallback(
    async (credentials) => {
      try {
        const result = await dispatch(loginUser(credentials)).unwrap();
        showWelcomeMessage(result.name || result.email);
        return result;
      } catch (error) {
        showAuthError(error?.message || error || 'Login failed');
        throw error;
      }
    },
    [dispatch]
  );

  /** Logout */
  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      showLogoutSuccess();
    } catch (error) {
      showAuthError(error?.message || error || 'Logout failed');
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
      
      showReauthSuccess();
      return true;
    } catch (error) {
      showReauthError(error?.message);
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
  // Use selectors for better performance
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectAuthError);
  const reauthRequired = useSelector(selectReauthRequired);
  const reauthMessage = useSelector(selectReauthMessage);
  const role = useSelector(selectUserRole);
  const isAdmin = useSelector(selectIsAdmin);
  const isUser = useSelector(selectIsUser);
  const permissions = useSelector(selectUserPermissions);
  const isUserActive = useSelector(selectIsUserActive);
  const lastLoginAttempt = useSelector(selectLastLoginAttempt);
  const canAccessAdmin = useSelector(selectCanAccessAdmin);
  const canAccessUser = useSelector(selectCanAccessUser);

  // Memoized computed values
  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission) || isAdmin;
  }, [permissions, isAdmin]);

  const canAccess = useCallback((requiredRole) => {
    if (!isAuthenticated || !isUserActive) return false;
    if (requiredRole === 'admin') return isAdmin;
    if (requiredRole === 'user') return isUser || isAdmin;
    return true;
  }, [isAuthenticated, isUserActive, isAdmin, isUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    role,
    isAdmin,
    isUser,
    permissions,
    isUserActive,
    lastLoginAttempt,
    canAccessAdmin,
    canAccessUser,
    hasPermission,
    canAccess,
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
