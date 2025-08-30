import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  selectUser,
  selectIsLoading,
  selectIsAuthChecking,
  selectAuthError,
  selectUserRole,
  selectUserPermissions,
  selectCanAccessAdmin,
  selectCanAccessUser,
} from '../../features/auth/authSlice';

import {
  showWelcomeMessage,
  showLogoutSuccess,
  showAuthError,
} from '../utils/toast';

// Refined useAuth hook with simplified API and better consistency
export const useAuth = () => {
  const dispatch = useDispatch();

  // Use individual selectors for better performance and memoization
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const error = useSelector(selectAuthError);
  const role = useSelector(selectUserRole);
  const permissions = useSelector(selectUserPermissions);
  const canAccessAdmin = useSelector(selectCanAccessAdmin);
  const canAccessUser = useSelector(selectCanAccessUser);

  // Ensure user object has required properties with fallbacks - memoized to prevent unnecessary re-renders
  const safeUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      role: user.role || 'user',
      isActive: user.isActive !== false,
      email: user.email || '',
      name: user.name || '',
      uid: user.uid || ''
    };
  }, [user?.uid, user?.role, user?.isActive, user?.email, user?.name]);

  // Auth actions
  const login = useCallback(async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
      const user = result.user || result;
      showWelcomeMessage(user.name || user.email);
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

  // Enhanced access control with better consistency
  const canAccess = useCallback((requiredRole) => {
    if (requiredRole === 'admin') {
      return canAccessAdmin;
    }
    if (requiredRole === 'user') {
      return canAccessUser;
    }
    // This explicitly handles a request for any authenticated user
    if (requiredRole === 'authenticated') {
      return !!user; // Check if the user object exists
    }
    // By default, if the requested role is not recognized, deny access
    return false;
  }, [canAccessAdmin, canAccessUser, user]);

  const hasPermission = useCallback((permission) => {
    return permissions.includes(permission) || role === 'admin';
  }, [permissions, role]);

  // Simplified auth status check
  const isReady = useCallback(() => {
    return !isAuthChecking && !isLoading;
  }, [isAuthChecking, isLoading]);

  return {
    // Core state
    user: safeUser,
    isLoading,
    isAuthChecking,
    error,
    
    // Role and permissions
    role,
    permissions,
    
    // Access control (primary API)
    canAccess,
    hasPermission,
    
    // Actions
    login,
    logout,
    clearError,
    
    // Utility
    isReady,
  };
};


