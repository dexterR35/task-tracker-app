import { logger } from "@/utils/logger";
import { showError, showSuccess } from "@/utils/toast";
import { ERROR_SYSTEM } from '@/constants';


export const ERROR_TYPES = ERROR_SYSTEM.TYPES;
export const ERROR_SEVERITY = ERROR_SYSTEM.SEVERITY;

/**
 * Standard error response structure - ensures all values are serializable
 */
export const createErrorResponse = (type, message, details = null, severity = ERROR_SEVERITY.MEDIUM) => {
  // Ensure details is serializable (no functions, classes, or complex objects)
  let serializableDetails = null;
  if (details) {
    if (typeof details === 'object' && details !== null) {
      try {
        // Only include primitive values and plain objects, handle circular references
        serializableDetails = JSON.parse(JSON.stringify(details, (key, value) => {
          // Skip HTML elements and other non-serializable objects
          if (value instanceof HTMLElement ||
              value instanceof Node ||
              typeof value === 'function' ||
              (typeof value === 'object' && value.constructor && value.constructor.name === 'FiberNode')) {
            return '[Circular Reference]';
          }
          return value;
        }));
      } catch (error) {
        // If serialization still fails, create a safe representation
        serializableDetails = {
          error: 'Failed to serialize details',
          type: typeof details,
          constructor: details.constructor?.name || 'Unknown'
        };
      }
    } else if (typeof details === 'string' || typeof details === 'number' || typeof details === 'boolean') {
      serializableDetails = details;
    }
  }

  return {
    type,
    message,
    details: serializableDetails,
    severity,
    timestamp: new Date().toISOString(),
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
};


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

  // Handle generic permission errors (including "Missing or insufficient permissions")
  if (errorMessage?.includes('Missing or insufficient permissions') ||
      errorMessage?.includes('permission') ||
      errorCode === 'permission-denied') {
    return createErrorResponse(ERROR_TYPES.AUTHORIZATION, 'You do not have permission to perform this action.', { code: errorCode }, ERROR_SEVERITY.HIGH);
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


export const handleValidationError = (errors, formName = 'form') => {
  const errorFields = Object.keys(errors);

  // Safely extract error messages, avoiding circular references
  const errorMessages = errorFields.map(field => {
    const error = errors[field];
    if (error && typeof error === 'object') {
      // Extract only the message property, avoiding HTML elements
      return error.message || error.type || 'Validation error';
    }
    return error || 'Validation error';
  });

  const errorResponse = createErrorResponse(
    ERROR_TYPES.VALIDATION,
    `Validation failed for ${errorFields.length} field(s)`,
    { fields: errorFields, messages: errorMessages },
    ERROR_SEVERITY.LOW
  );

  logger.warn(`[${formName}] Validation errors:`, errorResponse);

  return errorResponse;
};


export const handleSuccess = (message, data = null, operation = 'operation') => {
  const successResponse = {
    type: 'SUCCESS',
    message,
    data,
    timestamp: new Date().toISOString(),
    operation
  };

  showSuccess(message);

  return successResponse;
};


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
