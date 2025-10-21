/**
 * Authentication utility functions
 * Centralized authentication state checking and user validation
 * 
 * @fileoverview Provides comprehensive authentication and authorization utilities
 * @author Senior Developer
 * @version 2.0.0
 */

import { logger } from '@/utils/logger';

// ============================================================================
// CORE AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Check if user has admin role
 * @param {Object} user - User object
 * @returns {boolean} - True if user is admin
 */
const isAdmin = (user) => {
  return user?.role === 'admin';
};

// ============================================================================
// EXPORTED AUTHENTICATION FUNCTIONS
// ============================================================================

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
 * Validates user object structure and completeness
 * @param {Object} user - User object to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - Whether to use strict validation
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
export const validateUserStructure = (user, options = {}) => {
  const { strict = false } = options;
  
  if (!user) {
    return { isValid: false, errors: ['User object is required'] };
  }
  
  const errors = [];
  const requiredFields = ['uid', 'email', 'name', 'role'];
  
  if (strict) {
    requiredFields.push('permissions', 'isActive');
  }
  
  requiredFields.forEach(field => {
    if (!user[field] && user[field] !== false) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
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

/**
 * Enhanced permission checking with caching
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermissionCached = (() => {
  const cache = new Map();
  
  return (user, permission) => {
    if (!user || !permission) return false;
    
    const cacheKey = `${user.uid || user.userUID}_${permission}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    const result = hasPermission(user, permission);
    cache.set(cacheKey, result);
    
    // Clear cache after 5 minutes to prevent stale data
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
    
    return result;
  };
})();

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
 * Check if user can access specific role
 * @param {Object} user - User object
 * @param {string} requiredRole - Required role ('admin', 'user')
 * @returns {boolean} - True if user can access the role
 */
export const canAccessRole = (user, requiredRole) => {
  if (!user) return false;
  
  if (requiredRole === "admin") {
    return isAdmin(user);
  }
  
  if (requiredRole === "user") {
    return user.role === 'user' || isAdmin(user); // Admins can access user routes
  }
  
  return false;
};

/**
 * Check if user can access tasks
 * @param {Object} user - User object
 * @returns {boolean} - True if user can access tasks
 */
export const canAccessTasks = (user) => {
  if (!user) return false;
  return hasPermission(user, 'view_tasks') || isAdmin(user);
};

/**
 * Check if user can access charts
 * @param {Object} user - User object
 * @returns {boolean} - True if user can access charts
 */
export const canAccessCharts = (user) => {
  if (!user) return false;
  return hasPermission(user, 'generate_charts') || isAdmin(user);
};

/**
 * Check if user is active
 * @param {Object} user - User object
 * @returns {boolean} - True if user is active
 */
export const isUserActive = (user) => {
  if (!user) return false;
  return user.isActive !== false; // Default to true if not specified
};

/**
 * Check if user has a specific permission
 * @param {Object} userData - User data object
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (userData, permission) => {
  // Check if user is active first
  if (!isUserActive(userData)) {
    return false;
  }
  
  // All users (including admins) must have explicit permissions
  if (!userData || !userData.permissions || !Array.isArray(userData.permissions)) {
    return false;
  }
  return userData.permissions.includes(permission);
};

/**
 * ============================================================================
 * ROLE-BASED PERMISSION FUNCTIONS
 * ============================================================================
 */

/**
 * Check if user can create tasks
 * @param {Object} user - User object
 * @returns {boolean} - True if user can create tasks
 */
export const canCreateTask = (user) => {
  if (!user) return false;
  return hasPermission(user, 'create_tasks') || isAdmin(user);
};

/**
 * Check if user can update tasks
 * @param {Object} user - User object
 * @returns {boolean} - True if user can update tasks
 */
export const canUpdateTask = (user) => {
  if (!user) return false;
  return hasPermission(user, 'update_tasks') || isAdmin(user);
};

/**
 * Check if user can delete tasks
 * @param {Object} user - User object
 * @returns {boolean} - True if user can delete tasks
 */
export const canDeleteTask = (user) => {
  if (!user) return false;
  return hasPermission(user, 'delete_tasks') || isAdmin(user);
};

/**
 * Check if user can view tasks
 * @param {Object} user - User object
 * @returns {boolean} - True if user can view tasks
 */
export const canViewTasks = (user) => {
  if (!user) return false;
  return hasPermission(user, 'view_tasks') || isAdmin(user);
};

/**
 * Check if user can create boards
 * @param {Object} user - User object
 * @returns {boolean} - True if user can create boards
 */
export const canCreateBoard = (user) => {
  if (!user) return false;
  return hasPermission(user, 'create_boards') || isAdmin(user);
};

/**
 * Check if user can submit forms
 * @param {Object} user - User object
 * @returns {boolean} - True if user can submit forms
 */
export const canSubmitForms = (user) => {
  if (!user) return false;
  return isUserActive(user) && (user.role === 'user' || isAdmin(user));
};

/**
 * Check if user can delete data (admin-only operation)
 * @param {Object} user - User object
 * @returns {boolean} - True if user can delete data
 */
export const canDeleteData = (user) => {
  if (!user) return false;
  return hasPermission(user, 'delete_data') || isAdmin(user);
};

/**
 * Check if user can perform all task CRUD operations
 * @param {Object} user - User object
 * @returns {boolean} - True if user can perform all task operations
 */
export const canPerformTaskCRUD = (user) => {
  if (!user) return false;
  return canCreateTask(user) && canUpdateTask(user) && canDeleteTask(user);
};

/**
 * Check if user has admin permissions
 * @param {Object} user - User object
 * @returns {boolean} - True if user has admin permissions
 */
export const hasAdminPermissions = (user) => {
  if (!user) return false;
  return isAdmin(user) && isUserActive(user);
};

/**
 * Get comprehensive permission summary for a user
 * @param {Object} user - User object
 * @returns {Object} - Complete permission summary
 */
export const getUserPermissionSummary = (user) => {
  if (!user) {
    return {
      isActive: false,
      role: 'none',
      permissions: [],
      canCreateTask: false,
      canUpdateTask: false,
      canDeleteTask: false,
      canViewTasks: false,
      canCreateBoard: false,
      canSubmitForms: false,
      canDeleteData: false,
      canPerformTaskCRUD: false,
      hasAdminPermissions: false
    };
  }

  return {
    isActive: isUserActive(user),
    role: user.role || 'user',
    permissions: user.permissions || [],
    canCreateTask: canCreateTask(user),
    canUpdateTask: canUpdateTask(user),
    canDeleteTask: canDeleteTask(user),
    canViewTasks: canViewTasks(user),
    canCreateBoard: canCreateBoard(user),
    canSubmitForms: canSubmitForms(user),
    canDeleteData: canDeleteData(user),
    canPerformTaskCRUD: canPerformTaskCRUD(user),
    hasAdminPermissions: hasAdminPermissions(user)
  };
};

/**
 * Validate user permissions for API operations
 * @param {Object} userData - User data object
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @param {Object} options - Validation options
 * @returns {Object} - Validation result
 */
export const validateUserPermissions = (userData, requiredPermissions, options = {}) => {
  const { 
    operation = 'unknown', 
    logWarnings = true,
    requireActive = true 
  } = options;

  // Check if user data is provided
  if (!userData) {
    const error = "User data not provided for permission validation";
    if (logWarnings) {
      logger.warn(`[validateUserPermissions] ${error} for ${operation}`);
    }
    return { isValid: false, errors: [error] };
  }

  // Check if user is active (if required)
  if (requireActive && !isUserActive(userData)) {
    const error = "User account is not active";
    if (logWarnings) {
      logger.warn(`[validateUserPermissions] ${error} for ${operation}`);
    }
    return { isValid: false, errors: [error] };
  }

  // Check permissions
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  
  const hasRequiredPermission = permissions.some(permission => {
    return hasPermission(userData, permission);
  });

  if (!hasRequiredPermission) {
    const error = `User lacks required permissions for ${operation}`;
    if (logWarnings) {
      logger.warn(`[validateUserPermissions] ${error}:`, {
        userUID: userData.userUID || userData.uid,
        email: userData.email,
        role: userData.role,
        userPermissions: userData.permissions || [],
        requiredPermissions: permissions
      });
    }
    return { isValid: false, errors: [error] };
  }

  return { isValid: true, errors: [] };
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
