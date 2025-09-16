/**
 * Authentication utility functions
 * Centralized authentication state checking and user validation
 */

import { logger } from './logger';
import { isAdmin, canAccessRole, canAccessTasks, canAccessCharts } from './permissions';
import { validateUserPermissions } from '@/utils/permissions';
import { validateUserForAPI } from '@/features/auth/authSlice';

/**
 * Get user UID from user object (handles different property names)
 * @param {Object} user - User object
 * @returns {string|null} - User UID or null if not found
 */
export const getUserUID = (user) => {
  if (!user) return null;
  return user.userUID || user.uid || user.id || null;
};

/**
 * Check if user object is complete and valid
 * @param {Object} user - User object
 * @returns {boolean} - True if user is complete and valid
 */
export const isUserComplete = (user) => {
  if (!user) return false;
  return !!(user.userUID || user.uid) && !!user.email && !!user.name && !!user.role;
};

// REMOVED: Internal validation functions (were only used by duplicate validateUserForAPI)

// REMOVED: Duplicate validateUserPermissions function
// Use validateUserPermissions from @/features/api/baseApi.js instead

// REMOVED: Duplicate validateUserForAPI function
// Use validateUserForAPI from @/features/api/baseApi.js instead

// Internal function for getAuthStatus - strict validation
const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  // Require both name and email - if missing, user is not properly authenticated
  if (!user.name || !user.email) {
    return 'Incomplete User Data';
  }
  return user.name;
};

/**
 * Check if user is authenticated and ready
 * @param {Object} authState - Auth state object
 * @returns {boolean} - True if user is authenticated and ready
 */
export const isUserAuthenticated = (authState) => {
  if (!authState) return false;
  return !!(authState.user && !authState.isAuthChecking && !authState.isLoading);
};

/**
 * Check if authentication is still loading/checking
 * @param {Object} authState - Auth state object
 * @returns {boolean} - True if still loading/checking
 */
export const isAuthLoading = (authState) => {
  if (!authState) return true;
  return authState.isAuthChecking || authState.isLoading;
};

/**
 * Check if user has admin role
 * @param {Object} user - User object
 * @returns {boolean} - True if user is admin
 */
export const isUserAdmin = (user) => {
  return isAdmin(user);
};

/**
 * Get user role with fallback
 * @param {Object} user - User object
 * @returns {string} - User role or 'user' as default
 */
export const getUserRole = (user) => {
  if (!user) return 'user';
  return user.role || 'user';
};

/**
 * Get authentication status summary
 * @param {Object} authState - Auth state object
 * @returns {Object} - Authentication status summary
 */
export const getAuthStatus = (authState) => {
  if (!authState) {
    return {
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: 'No auth state available'
    };
  }

  return {
    isAuthenticated: isUserAuthenticated(authState),
    isLoading: isAuthLoading(authState),
    user: authState.user,
    error: authState.error,
    isAdmin: isUserAdmin(authState.user),
    userUID: getUserUID(authState.user),
    displayName: getUserDisplayName(authState.user),
    role: getUserRole(authState.user)
  };
};
