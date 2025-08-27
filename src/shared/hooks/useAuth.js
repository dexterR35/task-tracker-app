import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectIsAuthChecking,
  selectAuthError,
  selectUserRole,
  selectIsAdmin,
  selectIsUser,
  selectUserPermissions,
  selectIsUserActive,
  selectCanAccessAdmin,
  selectCanAccessUser,
} from '../../features/auth/authSlice';

import {
  showWelcomeMessage,
  showLogoutSuccess,
  showAuthError,
} from '../utils/toast';

// Simple useAuth hook that combines actions and state
export const useAuth = () => {
  const dispatch = useDispatch();

  // Auth state selectors
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectIsLoading);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const error = useSelector(selectAuthError);
  const role = useSelector(selectUserRole);
  const isAdmin = useSelector(selectIsAdmin);
  const isUser = useSelector(selectIsUser);
  const permissions = useSelector(selectUserPermissions);
  const isUserActive = useSelector(selectIsUserActive);
  const canAccessAdmin = useSelector(selectCanAccessAdmin);
  const canAccessUser = useSelector(selectCanAccessUser);

  // Auth actions
  const login = useCallback(async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      const user = result.user || result;
      showWelcomeMessage(user.name || user.email, user.lastLogin);
      return result;
    } catch (error) {
      showAuthError(error?.message || error || 'Login failed');
      throw error;
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      showLogoutSuccess();
    } catch (error) {
      showAuthError(error?.message || error || 'Logout failed');
    }
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Computed values
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
    // State
    user,
    isAuthenticated,
    isLoading,
    isAuthChecking,
    error,
    role,
    isAdmin,
    isUser,
    permissions,
    isUserActive,
    canAccessAdmin,
    canAccessUser,
    
    // Actions
    login,
    logout,
    clearError,
    
    // Computed
    hasPermission,
    canAccess,
  };
};


