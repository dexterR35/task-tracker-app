import { logger } from "@/utils/logger";
import { isAdmin, hasPermission, canAccessTasks, isUserActive } from "@/utils/permissions";
import { getCurrentMonthId } from "@/utils/dateUtils";
import { validateUserForAPI } from "@/utils/authUtils";


// Client-side validation functions
export const validateClientSide = {
  /**
   * Validate user authentication and basic data
   */
  validateAuthentication: (userData) => {
    if (!userData) {
      throw new Error("User data is required");
    }
    
    const validation = validateUserForAPI(userData, {
      requireUID: true,
      requireEmail: false,
      requireName: false,
      requireRole: false,
      logWarnings: true
    });
    
    if (!validation.isValid) {
      logger.warn("Client-side user validation failed:", validation.errors);
      throw new Error("Invalid user data");
    }
    
    return true;
  },

  /**
   * Validate user permissions for specific operations
   */
  validatePermissions: (userData, operation) => {
    // User activity is already checked in validateOperation - no need to check again
    if (!hasPermission(userData, operation)) {
      throw new Error(`Permission denied: You don't have permission to ${operation}`);
    }
    
    return true;
  },

  /**
   * Validate task access permissions
   */
  validateTaskAccess: (userData) => {
    // User activity is already checked in validateOperation - no need to check again
    if (!canAccessTasks(userData)) {
      throw new Error("No task access permissions");
    }
    
    return true;
  },

  /**
   * Validate admin permissions
   */
  validateAdminPermissions: (userData) => {
    if (!isAdmin(userData)) {
      throw new Error("Admin permissions required");
    }
    
    return true;
  },

  /**
   * Validate task ownership
   */
  validateTaskOwnership: (taskUserUID, currentUserUID, userRole) => {
    if (taskUserUID !== currentUserUID && !isAdmin({ role: userRole })) {
      throw new Error("Permission denied: You can only access your own tasks");
    }
    
    return true;
  },

  /**
   * Validate task data integrity
   */
  validateTaskData: (taskData, operation = 'create') => {
    const requiredFields = ['monthId'];
    
    // Check for monthId (always required)
    for (const field of requiredFields) {
      if (!taskData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // For taskName, check if it exists OR if jiraLink exists (which can generate taskName)
    if (!taskData.taskName && !taskData.jiraLink) {
      throw new Error('Missing required field: taskName or jiraLink (taskName can be generated from jiraLink)');
    }
    
    // Additional validation for updates
    if (operation === 'update') {
      const forbiddenFields = ['createdAt', 'createdByUID', 'createdByName'];
      for (const field of forbiddenFields) {
        if (taskData[field] !== undefined) {
          throw new Error(`Cannot update protected field: ${field}`);
        }
      }
    }
    
    return true;
  },

  /**
   * Validate month ID format
   */
  validateMonthId: (monthId) => {
    if (!monthId || typeof monthId !== 'string') {
      throw new Error("Month ID is required and must be a string");
    }
    
    if (!monthId.match(/^[0-9]{4}-[0-9]{2}$/)) {
      throw new Error("Invalid month ID format. Expected format: YYYY-MM");
    }
    
    return true;
  },

  /**
   * Validate that monthId is the current month (for task creation)
   */
  validateCurrentMonth: (monthId) => {
    const currentMonthId = getCurrentMonthId();
    
    if (monthId !== currentMonthId) {
      throw new Error(`Task creation is only allowed for the current month (${currentMonthId}). You attempted to create a task for ${monthId}.`);
    }
    
    return true;
  },

  /**
   * Validate board ID consistency
   */
  validateBoardIdConsistency: (providedBoardId, expectedBoardId, currentTaskBoardId) => {
    if (providedBoardId && expectedBoardId && providedBoardId !== expectedBoardId) {
      throw new Error("Provided boardId does not match the month board's boardId");
    }
    
    if (currentTaskBoardId && expectedBoardId && currentTaskBoardId !== expectedBoardId) {
      throw new Error("Task boardId mismatch - task may have been moved to a different board");
    }
    
    return true;
  }
};

// Server-side validation helpers (for Firebase Security Rules)
export const serverSideValidation = {
  /**
   * Generate Firebase Security Rules validation functions
   */
  generateSecurityRules: () => {
    return `
// Enhanced security validation functions for Firebase Security Rules
function isAuthenticated() {
  return request.auth != null;
}

function isUserActive() {
  return isAuthenticated() && 
         exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isActive == true;
}

function isAdmin() {
  return isUserActive() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

function isOwner(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

function hasPermission(permission) {
  return isUserActive() && 
         permission in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.permissions;
}

function isValidMonthId(monthId) {
  return monthId.matches('^[0-9]{4}-[0-9]{2}$');
}

function isValidTaskData() {
  return request.resource.data.keys().hasAll(['taskName', 'userUID', 'monthId', 'boardId', 'createdAt', 'createdByUID']) &&
         request.resource.data.userUID is string &&
         request.resource.data.monthId is string &&
         request.resource.data.boardId is string &&
         request.resource.data.createdAt is string &&
         request.resource.data.createdByUID is string &&
         request.resource.data.taskName is string &&
         request.resource.data.userUID.size() > 0 &&
         request.resource.data.monthId.size() > 0 &&
         request.resource.data.boardId.size() > 0;
}

function isValidBoardData() {
  return request.resource.data.keys().hasAll(['monthId', 'boardId', 'createdAt', 'createdBy', 'createdByRole']) &&
         request.resource.data.monthId is string &&
         request.resource.data.boardId is string &&
         request.resource.data.createdAt is timestamp &&
         request.resource.data.createdBy is string &&
         request.resource.data.createdByRole is string &&
         isValidMonthId(request.resource.data.monthId);
}
    `;
  }
};

// Simplified validation wrapper - reduced nested calls
export const validateOperation = async (operation, userData, additionalData = {}) => {
  try {
    // Step 1: Single user activity check (consolidated)
    if (!isUserActive(userData)) {
      throw new Error("Account is deactivated");
    }
    
    // Step 2: Operation-specific validation (simplified)
    switch (operation) {
      case 'create_task':
        // Combined permission and task access check
        if (!hasPermission(userData, 'create_task') || !canAccessTasks(userData)) {
          throw new Error("Permission denied: You don't have permission to create tasks");
        }
        validateClientSide.validateTaskData(additionalData.taskData, 'create');
        validateClientSide.validateMonthId(additionalData.monthId);
        validateClientSide.validateCurrentMonth(additionalData.monthId);
        break;
        
      case 'update_task':
        // Combined permission and task access check
        if (!hasPermission(userData, 'update_task') || !canAccessTasks(userData)) {
          throw new Error("Permission denied: You don't have permission to update tasks");
        }
        validateClientSide.validateTaskData(additionalData.taskData, 'update');
        validateClientSide.validateTaskOwnership(
          additionalData.taskUserUID, 
          additionalData.currentUserUID, 
          userData.role
        );
        break;
        
      case 'delete_task':
        // Combined permission and task access check
        if (!hasPermission(userData, 'delete_task') || !canAccessTasks(userData)) {
          throw new Error("Permission denied: You don't have permission to delete tasks");
        }
        validateClientSide.validateTaskOwnership(
          additionalData.taskUserUID, 
          additionalData.currentUserUID, 
          userData.role
        );
        break;
        
      case 'generate_month_board':
        if (!isAdmin(userData)) {
          throw new Error("Admin permissions required");
        }
        validateClientSide.validateMonthId(additionalData.monthId);
        break;
        
      case 'read_tasks':
        if (!canAccessTasks(userData)) {
          throw new Error("No task access permissions");
        }
        validateClientSide.validateMonthId(additionalData.monthId);
        break;
        
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    logger.log(`[SecurityValidation] ${operation} validation passed for user: ${userData.userUID}`);
    return { isValid: true, errors: [] };
    
  } catch (error) {
    logger.error(`[SecurityValidation] ${operation} validation failed:`, error.message);
    return { isValid: false, errors: [error.message] };
  }
};

// Export individual validation functions for backward compatibility
export const {
  validateAuthentication,
  validatePermissions,
  validateTaskAccess,
  validateAdminPermissions,
  validateTaskOwnership,
  validateTaskData,
  validateMonthId,
  validateBoardIdConsistency
} = validateClientSide;
