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
} from '../authSlice';

import {
  showWelcomeMessage,
  showLogoutSuccess,
  showAuthError,
} from '../../../utils/toast';

// Refined useAuth hook with simplified API and better consistency
export const useAuth = () => {
  const dispatch = useDispatch();

  // Core state selectors
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const error = useSelector(selectAuthError);

  // Validate user object has all required properties - if missing, user is not authenticated
  const safeUser = useMemo(() => {
    if (!user) return null;
    
    // Check for required fields - if any are missing, return null (not authenticated)
    if (!user.userUID || !user.email || !user.name || !user.role) {
      console.warn('User data incomplete - missing required fields:', {
        userUID: !!user.userUID,
        email: !!user.email,
        name: !!user.name,
        role: !!user.role
      });
      return null;
    }
    
    // Return user data as-is from database 
    return {
      ...user,
      permissions: Array.isArray(user.permissions) ? user.permissions : undefined
    };
  }, [
    user?.userUID,
    user?.email, 
    user?.name,
    user?.role, 
    user?.occupation,
    user?.permissions,
    user?.isActive,
    user?.createdAt
  ]);

  // Auth actions
  const login = useCallback(async (credentials) => {
    try {
      const result = await dispatch(loginUser(credentials)).unwrap();
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
    if (!user) return false;
    
    if (requiredRole === 'admin') {
      return user.role === 'admin';
    }
    if (requiredRole === 'user') {
      return user.role === 'user' || user.role === 'admin'; // Admins can access user routes
    }
    // This explicitly handles a request for any authenticated user
    if (requiredRole === 'authenticated') {
      return !!user; // Check if the user object exists
    }
    // By default, if the requested role is not recognized, deny access
    return false;
  }, [user]);

  // Permission-based access control
  const hasPermission = useCallback((permission) => {
    if (!safeUser || !safeUser.permissions || !Array.isArray(safeUser.permissions)) return false;
    return safeUser.permissions.includes(permission);
  }, [safeUser]);

  // Check if user can generate charts/analytics
  const canGenerate = useCallback(() => {
    return hasPermission('generate_charts');
  }, [hasPermission]);

  // Check if user can access task operations
  const canAccessTasks = useCallback(() => {
    return hasPermission('create_task') || hasPermission('update_task') || hasPermission('delete_task');
  }, [hasPermission]);

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
    
    // Access control
    canAccess,
    hasPermission,
    canGenerate,
    canAccessTasks,
    
    // Auth actions
    login,
    logout,
    clearError,
    
    // Utility
    isReady,
  };
};


