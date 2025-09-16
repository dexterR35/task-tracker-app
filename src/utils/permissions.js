/**
 * Shared permission utilities to eliminate duplicate logic across the app
 * Based on database permissions: delete_task, create_task, update_task, generate_charts, view_tasks, create_board
 */

import { logger } from '@/utils/logger';

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
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean} - True if user is admin
 */
export const isAdmin = (user) => {
  return user?.role === 'admin';
};

/**
 * Check if user can access a specific role
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
 * Check if user can access tasks (has any task-related permission)
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can access tasks
 */
export const canAccessTasks = (userData) => {
  // Admin users automatically have access to all tasks
  if (isAdmin(userData)) {
    return true;
  }
  
  return hasPermission(userData, 'view_task') || 
         hasPermission(userData, 'view_tasks') || 
         hasPermission(userData, 'create_task') || 
         hasPermission(userData, 'update_task') || 
         hasPermission(userData, 'delete_task');
};

/**
 * Check if user can access charts/analytics
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can access charts
 */
export const canAccessCharts = (userData) => {
  return hasPermission(userData, 'generate_charts');
};

/**
 * Check if user can create tasks
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can create tasks
 */
export const canCreateTask = (userData) => {
  return hasPermission(userData, 'create_task');
};

/**
 * Check if user can update tasks
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can update tasks
 */
export const canUpdateTask = (userData) => {
  return hasPermission(userData, 'update_task');
};

/**
 * Check if user can delete tasks
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can delete tasks
 */
export const canDeleteTask = (userData) => {
  return hasPermission(userData, 'delete_task');
};

/**
 * Check if user can view tasks
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can view tasks
 */
export const canViewTasks = (userData) => {
  return hasPermission(userData, 'view_tasks');
};

/**
 * Check if user can create boards
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can create boards
 */
export const canCreateBoard = (userData) => {
  return hasPermission(userData, 'create_board');
};

/**
 * Check if user can perform any CRUD operations on tasks
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can perform CRUD operations
 */
export const canPerformTaskCRUD = (userData) => {
  return canCreateTask(userData) || 
         canUpdateTask(userData) || 
         canDeleteTask(userData);
};

/**
 * Check if user can submit forms (create/update operations)
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user can submit forms
 */
export const canSubmitForms = (userData) => {
  return canCreateTask(userData) || canUpdateTask(userData);
};

/**
 * Check if user has any admin-level permissions
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user has admin permissions
 */
export const hasAdminPermissions = (userData) => {
  if (isAdmin(userData)) {
    return true;
  }
  
  const adminPermissions = [
    'create_board',
    'delete_task',
    'generate_charts'
  ];
  
  return adminPermissions.some(permission => hasPermission(userData, permission));
};

/**
 * Get user's permission summary for debugging/logging
 * @param {Object} userData - User data object
 * @returns {Object} - Permission summary
 */
export const getUserPermissionSummary = (userData) => {
  if (!userData) {
    return { hasPermissions: false, permissions: [], isAdmin: false, isActive: false };
  }
  
  return {
    hasPermissions: true,
    permissions: userData.permissions || [],
    isAdmin: isAdmin(userData),
    isActive: isUserActive(userData),
    canCreateTask: canCreateTask(userData),
    canUpdateTask: canUpdateTask(userData),
    canDeleteTask: canDeleteTask(userData),
    canViewTasks: canViewTasks(userData),
    canCreateBoard: canCreateBoard(userData),
    canGenerateCharts: canAccessCharts(userData),
    canSubmitForms: canSubmitForms(userData),
    canPerformTaskCRUD: canPerformTaskCRUD(userData)
  };
};

/**
 * Check if user is active
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user is active
 */
export const isUserActive = (userData) => {
  return userData?.isActive !== false; // Default to true if not specified
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
