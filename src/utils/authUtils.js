/**
 * Authentication utility functions
 * Centralized authentication state checking and user validation
 */

import { isAdmin, canAccessRole, canAccessTasks, canAccessCharts } from './permissions';

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

// Internal validation functions (used only by validateUserForAPI)
const validateUserData = (userData, options = {}) => {
  const { 
    requireUID = true, 
    requireEmail = true, 
    requireName = true, 
    requireRole = true,
    logWarnings = true 
  } = options;

  const errors = [];
  
  if (!userData) {
    if (logWarnings) {
      console.warn("User data not provided");
    }
    return { isValid: false, errors: ["User data not provided"] };
  }

  // Check for UID (either userUID or uid)
  if (requireUID && !userData.userUID && !userData.uid) {
    errors.push("User data missing userUID");
    if (logWarnings) {
      console.warn("User data missing userUID");
    }
  }

  // Check for email
  if (requireEmail && !userData.email) {
    errors.push("User data missing email");
    if (logWarnings) {
      console.warn("User data missing email");
    }
  }

  // Check for name
  if (requireName && !userData.name) {
    errors.push("User data missing name");
    if (logWarnings) {
      console.warn("User data missing name");
    }
  }

  // Check for role
  if (requireRole && !userData.role) {
    errors.push("User data missing role");
    if (logWarnings) {
      console.warn("User data missing role");
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUserRole = (user, validRoles = ["admin", "user"]) => {
  if (!user) {
    return { isValid: false, error: "User not provided" };
  }

  if (!user.role) {
    return { isValid: false, error: "User role not defined" };
  }

  if (!validRoles.includes(user.role)) {
    return { isValid: false, error: `Invalid user role: ${user.role}` };
  }

  return { isValid: true, error: null };
};

const validateUserPermissions = (user, requiredPermissions = []) => {
  if (!user) {
    return { isValid: false, error: "User not provided" };
  }

  if (!Array.isArray(user.permissions)) {
    return { isValid: false, error: "User permissions not defined" };
  }

  const missingPermissions = requiredPermissions.filter(
    permission => !user.permissions.includes(permission)
  );

  if (missingPermissions.length > 0) {
    return { 
      isValid: false, 
      error: `Missing permissions: ${missingPermissions.join(", ")}` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Comprehensive user validation for API operations
 * @param {Object} userData - User data object
 * @param {Object} options - Validation options
 * @returns {Object} - Comprehensive validation result
 */
export const validateUserForAPI = (userData, options = {}) => {
  const {
    requireUID = true,
    requireEmail = true,
    requireName = true,
    requireRole = true,
    validRoles = ["admin", "user"],
    requiredPermissions = [],
    logWarnings = true
  } = options;

  // Basic user data validation
  const basicValidation = validateUserData(userData, {
    requireUID,
    requireEmail,
    requireName,
    requireRole,
    logWarnings
  });

  if (!basicValidation.isValid) {
    return {
      isValid: false,
      errors: basicValidation.errors,
      type: "basic_validation"
    };
  }

  // Role validation
  const roleValidation = validateUserRole(userData, validRoles);
  if (!roleValidation.isValid) {
    return {
      isValid: false,
      errors: [roleValidation.error],
      type: "role_validation"
    };
  }

  // Permission validation (if required)
  if (requiredPermissions.length > 0) {
    const permissionValidation = validateUserPermissions(userData, requiredPermissions);
    if (!permissionValidation.isValid) {
      return {
        isValid: false,
        errors: [permissionValidation.error],
        type: "permission_validation"
      };
    }
  }

  return {
    isValid: true,
    errors: [],
    type: "success"
  };
};

// Internal function for getAuthStatus
const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  return user.name || user.email || 'Unknown User';
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
