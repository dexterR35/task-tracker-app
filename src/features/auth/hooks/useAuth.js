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

  // Enhanced access control with better consistency
  const canAccess = (requiredRole) => {
    if (requiredRole === 'authenticated') {
      return !!user; // Check if the user object exists
    }
    return canAccessRole(user, requiredRole);
  };

  // Permission-based access control
  const hasPermissionCallback = (permission) => {
    return hasPermission(safeUser, permission);
  };

  // Check if user can generate charts/analytics
  const canGenerate = () => {
    return canAccessCharts(safeUser);
  };

  // Check if user can access task operations
  const canAccessTasksCallback = () => {
    return canAccessTasks(safeUser);
  };

  // Comprehensive permission checking functions
  const canCreateTaskCallback = () => {
    return canCreateTask(safeUser);
  };

  const canUpdateTaskCallback = () => {
    return canUpdateTask(safeUser);
  };

  const canDeleteTaskCallback = () => {
    return canDeleteTask(safeUser);
  };

  const canViewTasksCallback = () => {
    return canViewTasks(safeUser);
  };

  const canCreateBoardCallback = () => {
    return canCreateBoard(safeUser);
  };

  const canSubmitFormsCallback = () => {
    return canSubmitForms(safeUser);
  };

  const canPerformTaskCRUDCallback = () => {
    return canPerformTaskCRUD(safeUser);
  };

  const hasAdminPermissionsCallback = () => {
    return hasAdminPermissions(safeUser);
  };

  const getUserPermissionSummaryCallback = () => {
    return getUserPermissionSummary(safeUser);
  };

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
    
    // Access control
    canAccess,
    hasPermission: hasPermissionCallback,
    canGenerate,
    canAccessTasks: canAccessTasksCallback,
    
    // Detailed permission checking
    canCreateTask: canCreateTaskCallback,
    canUpdateTask: canUpdateTaskCallback,
    canDeleteTask: canDeleteTaskCallback,
    canViewTasks: canViewTasksCallback,
    canCreateBoard: canCreateBoardCallback,
    canSubmitForms: canSubmitFormsCallback,
    canPerformTaskCRUD: canPerformTaskCRUDCallback,
    hasAdminPermissions: hasAdminPermissionsCallback,
    getUserPermissionSummary: getUserPermissionSummaryCallback,
    
    // Auth actions
    login,
    logout,
    clearError,
    
    // Utility
    isReady,
  };
};


