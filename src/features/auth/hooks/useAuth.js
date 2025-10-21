import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  isUserComplete, 
  canAccessRole, 
  canAccessTasks, 
  canAccessCharts,
  hasPermission,
  canCreateTask,
  canUpdateTask,
  canDeleteTask,
  canViewTasks,
  canCreateBoard,
  canSubmitForms,
  canPerformTaskCRUD,
  hasAdminPermissions,
  getUserPermissionSummary
} from '@/features/utils/authUtils';

import {
  loginUser,
  logoutUser,
  clearError as clearAuthError,
  selectUser,
  selectIsLoading,
  selectIsAuthChecking,
  selectAuthError,
} from '@/features/auth/authSlice';

import {
  showLogoutSuccess,
  showAuthError,
  showSuccess,
} from '@/utils/toast';

// Refined useAuth hook with simplified API and better consistency
export const useAuth = () => {
  const dispatch = useDispatch();

  // Core state selectors
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const error = useSelector(selectAuthError);

  // Validate user object has all required properties - if missing, user is not authenticated
  const safeUser = (() => {
    if (!user) return null;
    
    // Use centralized user validation
    if (!isUserComplete(user)) {
      // User data incomplete - missing required fields
      return null;
    }
    
    // Return user data as-is from database 
    return {
      ...user,
      permissions: Array.isArray(user.permissions) ? user.permissions : undefined
    };
  })();

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
      // Clear the session-based user logging flag
      if (window._loggedUser) {
        delete window._loggedUser;
      }
      showLogoutSuccess();
    } catch (error) {
      showAuthError(error?.message || error || 'Logout failed');
    }
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Memoized permission functions for better performance
  const permissionFunctions = useMemo(() => ({
    canAccess: (requiredRole) => {
      if (requiredRole === 'authenticated') {
        return !!user; // Check if the user object exists
      }
      return canAccessRole(user, requiredRole);
    },
    
    hasPermission: (permission) => hasPermission(safeUser, permission),
    canGenerate: () => canAccessCharts(safeUser),
    canAccessTasks: () => canAccessTasks(safeUser),
    canCreateTask: () => canCreateTask(safeUser),
    canUpdateTask: () => canUpdateTask(safeUser),
    canDeleteTask: () => canDeleteTask(safeUser),
    canViewTasks: () => canViewTasks(safeUser),
    canCreateBoard: () => canCreateBoard(safeUser),
    canSubmitForms: () => canSubmitForms(safeUser),
    canPerformTaskCRUD: () => canPerformTaskCRUD(safeUser),
    hasAdminPermissions: () => hasAdminPermissions(safeUser),
    getUserPermissionSummary: () => getUserPermissionSummary(safeUser)
  }), [user, safeUser]);

  // Simplified auth status check
  const isReady = () => {
    return !isAuthChecking && !isLoading;
  };

  return {
    // Core state
    user: safeUser,
    isLoading,
    isAuthChecking,
    error,
    
    // Permission functions (memoized for performance)
    ...permissionFunctions,
    
    // Auth actions
    login,
    logout,
    clearError,
    
    // Utility
    isReady,
  };
};


