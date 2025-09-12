/**
 * Debug logging utilities
 * Standardized debug logging patterns across the application
 */

import { logger } from './logger';

/**
 * Create a debug logger for a specific component
 * @param {string} componentName - Name of the component
 * @returns {Function} - Debug logging function
 */
export const createDebugLogger = (componentName) => {
  return (message, data = null) => {
    const prefix = `[${componentName}]`;
    if (data !== null) {
      logger.log(`${prefix} ${message}:`, data);
    } else {
      logger.log(`${prefix} ${message}`);
    }
  };
};

/**
 * Create a debug logger for API operations
 * @param {string} apiName - Name of the API
 * @returns {Function} - Debug logging function
 */
export const createApiDebugLogger = (apiName) => {
  return (operation, data = null) => {
    const prefix = `[${apiName} API]`;
    if (data !== null) {
      logger.log(`${prefix} ${operation}:`, data);
    } else {
      logger.log(`${prefix} ${operation}`);
    }
  };
};

/**
 * Create a debug logger for component state
 * @param {string} componentName - Name of the component
 * @returns {Function} - Debug logging function
 */
export const createStateDebugLogger = (componentName) => {
  return (stateName, data = null) => {
    const prefix = `[${componentName}]`;
    if (data !== null) {
      logger.log(`${prefix} ${stateName} State:`, data);
    } else {
      logger.log(`${prefix} ${stateName} State`);
    }
  };
};

/**
 * Create a debug logger for API calls
 * @param {string} apiName - Name of the API
 * @returns {Function} - Debug logging function
 */
export const createApiCallDebugLogger = (apiName) => {
  return (endpoint, params = null, result = null, error = null) => {
    const prefix = `[${apiName} API]`;
    
    if (error) {
      logger.log(`${prefix} ${endpoint} Error:`, { params, error });
    } else if (result) {
      logger.log(`${prefix} ${endpoint} Success:`, { params, result });
    } else {
      logger.log(`${prefix} ${endpoint} Call:`, params);
    }
  };
};

/**
 * Create a debug logger for user operations
 * @param {string} operation - Name of the operation
 * @returns {Function} - Debug logging function
 */
export const createUserDebugLogger = (operation) => {
  return (userData, additionalData = null) => {
    const prefix = `[User ${operation}]`;
    const data = {
      user: userData ? {
        userUID: userData.userUID || userData.uid,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive
      } : null,
      ...additionalData
    };
    logger.log(`${prefix} Debug:`, data);
  };
};

/**
 * Create a debug logger for task operations
 * @param {string} operation - Name of the operation
 * @returns {Function} - Debug logging function
 */
export const createTaskDebugLogger = (operation) => {
  return (taskData, additionalData = null) => {
    const prefix = `[Task ${operation}]`;
    const data = {
      task: taskData ? {
        id: taskData.id,
        taskName: taskData.taskName,
        status: taskData.status,
        userUID: taskData.userUID,
        monthId: taskData.monthId
      } : null,
      ...additionalData
    };
    logger.log(`${prefix} Debug:`, data);
  };
};

/**
 * Create a debug logger for authentication operations
 * @param {string} operation - Name of the operation
 * @returns {Function} - Debug logging function
 */
export const createAuthDebugLogger = (operation) => {
  return (authData, additionalData = null) => {
    const prefix = `[Auth ${operation}]`;
    const data = {
      auth: authData ? {
        isAuthenticated: !!authData.user,
        isAuthChecking: authData.isAuthChecking,
        isLoading: authData.isLoading,
        hasError: !!authData.error,
        userUID: authData.user?.userUID || authData.user?.uid,
        userRole: authData.user?.role
      } : null,
      ...additionalData
    };
    logger.log(`${prefix} Debug:`, data);
  };
};

/**
 * Standard debug logging patterns
 */
export const DebugPatterns = {
  // Component state logging
  COMPONENT_STATE: (componentName, stateName, data) => {
    createStateDebugLogger(componentName)(stateName, data);
  },
  
  // API call logging
  API_CALL: (apiName, endpoint, params, result, error) => {
    createApiCallDebugLogger(apiName)(endpoint, params, result, error);
  },
  
  // User operation logging
  USER_OPERATION: (operation, userData, additionalData) => {
    createUserDebugLogger(operation)(userData, additionalData);
  },
  
  // Task operation logging
  TASK_OPERATION: (operation, taskData, additionalData) => {
    createTaskDebugLogger(operation)(taskData, additionalData);
  },
  
  // Auth operation logging
  AUTH_OPERATION: (operation, authData, additionalData) => {
    createAuthDebugLogger(operation)(authData, additionalData);
  }
};

/**
 * Conditional debug logging - only logs in development
 * @param {Function} debugFn - Debug function to call
 * @param {Array} args - Arguments to pass to debug function
 */
export const debugLog = (debugFn, ...args) => {
  if (process.env.NODE_ENV === 'development') {
    debugFn(...args);
  }
};

/**
 * Performance debug logging
 * @param {string} operation - Name of the operation
 * @param {Function} fn - Function to measure
 * @returns {Promise} - Result of the function
 */
export const debugPerformance = async (operation, fn) => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    logger.log(`[Performance] ${operation} completed in ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    logger.log(`[Performance] ${operation} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
};
