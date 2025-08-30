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

  // Core state selectors
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectIsLoading);
  const isAuthChecking = useSelector(selectIsAuthChecking);
  const error = useSelector(selectAuthError);
  const canAccessAdmin = useSelector(selectCanAccessAdmin);
  const canAccessUser = useSelector(selectCanAccessUser);

  // Ensure user object has required properties with fallbacks - memoized to prevent unnecessary re-renders
  const safeUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      // Core properties (used in tables and UI)
      userUID: user.userUID || user.uid || user.id || '',
      email: user.email || '',
      name: user.name || '',
      
      // Role and permissions (used for filtering and permissions)
      role: user.role || 'user',
      occupation: user.occupation || user.role || 'user',
      isActive: user.isActive !== false,
      
      // Timestamp (used in user/reporter tables)
      createdAt: user.createdAt || null,
      
      // Compatibility (used internally)
      uid: user.uid || user.userUID || user.id || '',
      id: user.id || user.uid || user.userUID || ''
    };
  }, [
    user?.userUID,
    user?.uid, 
    user?.id,
    user?.email, 
    user?.name,
    user?.role, 
    user?.occupation,
    user?.isActive,
    user?.createdAt
  ]);

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
    
    // Auth actions
    login,
    logout,
    clearError,
    
    // Utility
    isReady,
  };
};


