

import { logger } from '@/utils/logger';


const isAdmin = (user) => {
  return user?.role === 'admin';
};


export const getUserUID = (user) => {
  if (!user) return null;
  return user?.id ?? null;
};


export const validateUserStructure = (user, options = {}) => {
  const { strict = false } = options;

  if (!user) {
    return { isValid: false, errors: ['User object is required'] };
  }

  const errors = [];
  const requiredFields = ['uid', 'email', 'name', 'role'];

  if (strict) {
    requiredFields.push('isActive');
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


export const isUserComplete = (user) => {
  if (!user) return false;
  return !!user?.id && !!user.email && !!user.name && !!user.role;
};


// Internal function for getAuthStatus - strict validation
const getUserDisplayName = (user) => {
  if (!user) return 'Unknown User';
  // Require both name and email - if missing, user is not properly authenticated
  if (!user.name || !user.email) {
    return 'Incomplete User Data';
  }
  return user.name;
};


export const isUserAuthenticated = (authState) => {
  if (!authState) return false;
  return !!(authState.user && !authState.isAuthChecking && !authState.isLoading);
};


export const isAuthLoading = (authState) => {
  if (!authState) return true;
  // Don't show loading if we've timed out
  if (authState.authTimeout) return false;
  return authState.isAuthChecking || authState.isLoading;
};


export const isUserAdmin = (user) => {
  return isAdmin(user);
};


export const getUserRole = (user) => {
  if (!user) return 'user';
  return user.role || 'user';
};


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


export const canAccessTasks = (user) => {
  if (!user) return false;
  return hasPermission(user, 'view_tasks');
};

export const canAccessCharts = (user) => {
  if (!user) return false;
  return hasPermission(user, 'generate_charts');
};

export const isUserActive = (user) => {
  if (!user) return false;
  return user.isActive !== false; // Default to true if not specified
};


/** Pure RBAC: permissions derived from role only. Admin has all; user has task-related. */
export const hasPermission = (userData, permission) => {
  if (!isUserActive(userData)) return false;
  if (userData?.role === 'admin') return true;
  const userPermissions = ['create_tasks', 'update_tasks', 'delete_tasks', 'view_tasks', 'submit_forms'];
  return userPermissions.includes(permission);
};


export const canCreateTask = (user) => {
  if (!user) return false;
  return hasPermission(user, 'create_tasks');
};


export const canUpdateTask = (user) => {
  if (!user) return false;
  return hasPermission(user, 'update_tasks');
};


export const canDeleteTask = (user) => {
  if (!user) return false;
  return hasPermission(user, 'delete_tasks');
};


export const canViewTasks = (user) => {
  if (!user) return false;
  return hasPermission(user, 'view_tasks');
};


/** Pure RBAC: admin can create boards; user cannot. */
export const canCreateBoard = (user) => {
  if (!user) return false;
  return isUserActive(user) && user.role === 'admin';
};


export const canSubmitForms = (user) => {
  if (!user) return false;
  return isUserActive(user) && hasPermission(user, 'submit_forms');
};


export const canDeleteData = (user) => {
  if (!user) return false;
  return hasPermission(user, 'delete_data');
};


export const canPerformTaskCRUD = (user) => {
  if (!user) return false;
  return canCreateTask(user) && canUpdateTask(user) && canDeleteTask(user);
};


export const hasAdminPermissions = (user) => {
  if (!user) return false;
  return isAdmin(user) && isUserActive(user);
};


export const getUserPermissionSummary = (user) => {
  if (!user) {
    return {
      isActive: false,
      role: 'none',
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

  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  const hasRequiredPermission = permissions.some(permission => hasPermission(userData, permission));

  if (!hasRequiredPermission) {
    const error = `User lacks required permissions for ${operation}`;
    if (logWarnings) {
      logger.warn(`[validateUserPermissions] ${error}:`, {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        requiredPermissions: permissions
      });
    }
    return { isValid: false, errors: [error] };
  }

  return { isValid: true, errors: [] };
};


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
    userId: getUserUID(authState.user),
    displayName: getUserDisplayName(authState.user),
    role: getUserRole(authState.user)
  };
};
