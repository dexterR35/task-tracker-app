import { logger } from "@/utils/logger";
import { showError, showSuccess } from "@/utils/toast";

/**
 * Standardized error handling utilities
 * Provides consistent error handling patterns across the application
 */

/**
 * Error types for consistent error handling
 */
export const ERROR_TYPES = {
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 */
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Standard error response structure
 */
export const createErrorResponse = (type, message, details = null, severity = ERROR_SEVERITY.MEDIUM) => ({
  type,
  message,
  details,
  severity,
  timestamp: new Date().toISOString(),
  id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
});

/**
 * Parse Firebase/Firestore errors into standardized format
 * @param {Error} error - The error object
 * @returns {Object} - Standardized error response
 */
export const parseFirebaseError = (error) => {
  if (!error) {
    return createErrorResponse(ERROR_TYPES.UNKNOWN, 'An unknown error occurred');
  }

  const errorCode = error.code || error.error?.code;
  const errorMessage = error.message || error.error?.message || 'An error occurred';

  // Firebase Auth errors
  if (errorCode?.startsWith('auth/')) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return createErrorResponse(ERROR_TYPES.AUTHENTICATION, 'No account found with this email address.', null, ERROR_SEVERITY.MEDIUM);
      case 'auth/wrong-password':
        return createErrorResponse(ERROR_TYPES.AUTHENTICATION, 'Incorrect password. Please try again.', null, ERROR_SEVERITY.MEDIUM);
      case 'auth/too-many-requests':
        return createErrorResponse(ERROR_TYPES.AUTHENTICATION, 'Too many failed attempts. Please try again later.', null, ERROR_SEVERITY.HIGH);
      case 'auth/user-disabled':
        return createErrorResponse(ERROR_TYPES.AUTHENTICATION, 'This account has been disabled.', null, ERROR_SEVERITY.HIGH);
      case 'auth/invalid-email':
        return createErrorResponse(ERROR_TYPES.VALIDATION, 'Invalid email address format.', null, ERROR_SEVERITY.LOW);
      case 'auth/weak-password':
        return createErrorResponse(ERROR_TYPES.VALIDATION, 'Password is too weak. Please choose a stronger password.', null, ERROR_SEVERITY.LOW);
      default:
        return createErrorResponse(ERROR_TYPES.AUTHENTICATION, errorMessage, { code: errorCode }, ERROR_SEVERITY.MEDIUM);
    }
  }

  // Firestore errors
  if (errorCode?.startsWith('firestore/')) {
    switch (errorCode) {
      case 'firestore/permission-denied':
        return createErrorResponse(ERROR_TYPES.AUTHORIZATION, 'You do not have permission to perform this action.', null, ERROR_SEVERITY.HIGH);
      case 'firestore/unavailable':
        return createErrorResponse(ERROR_TYPES.NETWORK, 'Service temporarily unavailable. Please try again later.', null, ERROR_SEVERITY.HIGH);
      case 'firestore/not-found':
        return createErrorResponse(ERROR_TYPES.NOT_FOUND, 'The requested resource was not found.', null, ERROR_SEVERITY.MEDIUM);
      case 'firestore/already-exists':
        return createErrorResponse(ERROR_TYPES.VALIDATION, 'This resource already exists.', null, ERROR_SEVERITY.MEDIUM);
      case 'firestore/failed-precondition':
        return createErrorResponse(ERROR_TYPES.VALIDATION, 'Operation failed due to a precondition.', null, ERROR_SEVERITY.MEDIUM);
      default:
        return createErrorResponse(ERROR_TYPES.SERVER, errorMessage, { code: errorCode }, ERROR_SEVERITY.MEDIUM);
    }
  }

  // Network errors
  if (errorCode === 'NETWORK_ERROR' || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return createErrorResponse(ERROR_TYPES.NETWORK, 'Network error. Please check your connection and try again.', null, ERROR_SEVERITY.HIGH);
  }

  // RTK Query errors
  if (error?.data) {
    return createErrorResponse(ERROR_TYPES.SERVER, error.data.message || errorMessage, error.data, ERROR_SEVERITY.MEDIUM);
  }

  // Generic errors
  return createErrorResponse(ERROR_TYPES.UNKNOWN, errorMessage, { originalError: error }, ERROR_SEVERITY.MEDIUM);
};

/**
 * Handle API errors with standardized response
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed (for logging)
 * @param {Object} options - Additional options
 * @returns {Object} - Standardized error response
 */
export const handleApiError = (error, operation = 'API operation', options = {}) => {
  const { showToast = true, logError = true } = options;
  
  const errorResponse = parseFirebaseError(error);
  
  if (logError) {
    logger.error(`[${operation}] Error:`, {
      error: errorResponse,
      originalError: error,
      operation
    });
  }
  
  if (showToast) {
    showError(errorResponse.message);
  }
  
  return errorResponse;
};

/**
 * Handle form validation errors
 * @param {Object} errors - Formik errors object
 * @param {string} formName - Name of the form (for logging)
 * @returns {Object} - Standardized error response
 */
export const handleValidationError = (errors, formName = 'form') => {
  const errorFields = Object.keys(errors);
  const errorMessages = Object.values(errors);
  
  const errorResponse = createErrorResponse(
    ERROR_TYPES.VALIDATION,
    `Validation failed for ${errorFields.length} field(s)`,
    { fields: errorFields, messages: errorMessages },
    ERROR_SEVERITY.LOW
  );
  
  logger.warn(`[${formName}] Validation errors:`, errorResponse);
  
  return errorResponse;
};

/**
 * Handle success responses
 * @param {string} message - Success message
 * @param {Object} data - Success data
 * @param {string} operation - The operation that succeeded
 * @returns {Object} - Standardized success response
 */
export const handleSuccess = (message, data = null, operation = 'operation') => {
  const successResponse = {
    type: 'SUCCESS',
    message,
    data,
    timestamp: new Date().toISOString(),
    operation
  };
  
  logger.log(`[${operation}] Success:`, successResponse);
  showSuccess(message);
  
  return successResponse;
};

/**
 * Create a standardized async error handler
 * @param {Function} operation - The async operation to execute
 * @param {Object} options - Error handling options
 * @returns {Function} - Wrapped function with error handling
 */
export const withErrorHandling = (operation, options = {}) => {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      const { operationName = 'operation', showToast = true, logError = true } = options;
      return handleApiError(error, operationName, { showToast, logError });
    }
  };
};

/**
 * Create a standardized async operation wrapper for RTK Query
 * @param {Function} mutationFn - The RTK Query mutation function
 * @param {Object} options - Error handling options
 * @returns {Function} - Wrapped mutation function
 */
export const withMutationErrorHandling = (mutationFn, options = {}) => {
  return async (arg) => {
    try {
      const result = await mutationFn(arg).unwrap();
      const { successMessage, operationName = 'mutation' } = options;
      
      if (successMessage) {
        handleSuccess(successMessage, result, operationName);
      }
      
      return result;
    } catch (error) {
      const { operationName = 'mutation', showToast = true, logError = true } = options;
      throw handleApiError(error, operationName, { showToast, logError });
    }
  };
};

/**
 * Error boundary helper for React components
 * @param {Error} error - The error object
 * @param {string} componentName - Name of the component
 * @returns {Object} - Error information for display
 */
export const getErrorBoundaryInfo = (error, componentName = 'Component') => {
  const errorResponse = parseFirebaseError(error);
  
  logger.error(`[${componentName}] Error boundary caught error:`, {
    error: errorResponse,
    componentName,
    stack: error.stack
  });
  
  return {
    title: 'Something went wrong',
    message: errorResponse.message,
    details: errorResponse.details,
    severity: errorResponse.severity,
    componentName
  };
};