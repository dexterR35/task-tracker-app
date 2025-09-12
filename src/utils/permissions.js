/**
 * Shared permission utilities to eliminate duplicate logic across the app
 */

/**
 * Check if user has a specific permission
 * @param {Object} userData - User data object
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if user has permission
 */
export const hasPermission = (userData, permission) => {
  // Admin users automatically have all permissions
  if (isAdmin(userData)) {
    return true;
  }
  
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
  // Admin users automatically have access to charts
  if (isAdmin(userData)) {
    return true;
  }
  
  return hasPermission(userData, 'generate_charts');
};


/**
 * Check if user is active
 * @param {Object} userData - User data object
 * @returns {boolean} - True if user is active
 */
export const isUserActive = (userData) => {
  return userData?.isActive !== false; // Default to true if not specified
};
