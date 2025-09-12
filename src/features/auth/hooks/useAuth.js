import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hasPermission, isAdmin, canAccessRole, canAccessTasks, canAccessCharts } from '@/utils/permissions';
import { isUserComplete } from '@/utils/authUtils';

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
  showSuccess,
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
    
    // Use centralized user validation
    if (!isUserComplete(user)) {
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
      
      // Show welcome message after successful login
      if (safeUser) {
        const welcomeMessage = `Welcome, ${safeUser.name || safeUser.email}! 👋`;
        showSuccess(welcomeMessage, { 
          autoClose: 3000,
          position: "top-center"
        });
      }
      
      return result;
    } catch (error) {
      showAuthError(error?.message || error || 'Login failed');
      throw error;
    }
  }, [dispatch, safeUser]);

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
    if (requiredRole === 'authenticated') {
      return !!user; // Check if the user object exists
    }
    return canAccessRole(user, requiredRole);
  }, [user]);

  // Permission-based access control
  const hasPermissionCallback = useCallback((permission) => {
    return hasPermission(safeUser, permission);
  }, [safeUser]);

  // Check if user can generate charts/analytics
  const canGenerate = useCallback(() => {
    return canAccessCharts(safeUser);
  }, [safeUser]);

  // Check if user can access task operations
  const canAccessTasksCallback = useCallback(() => {
    return canAccessTasks(safeUser);
  }, [safeUser]);

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
    hasPermission: hasPermissionCallback,
    canGenerate,
    canAccessTasks: canAccessTasksCallback,
    
    // Auth actions
    login,
    logout,
    clearError,
    
    // Utility
    isReady,
  };
};


