import { logger } from "@/utils/logger";
import { showError, showSuccess } from "@/utils/toast";
import { sanitizeErrorData } from "@/utils/sanitizeErrorData";
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


/**
 * Parse API/HTTP errors (PERN backend)
 */
export const parseApiError = (error) => {
  if (!error) {
    return createErrorResponse(ERROR_TYPES.UNKNOWN, 'An unknown error occurred');
  }

  const status = error.status;
  const errorMessage = error.data?.error || error.message || error.error?.message || 'An error occurred';
  const errorCode = error.code || error.error?.code;

  // PERN backend / HTTP errors
  if (status === 401) {
    return createErrorResponse(ERROR_TYPES.AUTHENTICATION, errorMessage || 'Invalid or expired session. Please sign in again.', null, ERROR_SEVERITY.MEDIUM);
  }
  if (status === 403) {
    return createErrorResponse(ERROR_TYPES.AUTHORIZATION, errorMessage || 'You do not have permission.', null, ERROR_SEVERITY.HIGH);
  }
  if (status === 404) {
    return createErrorResponse(ERROR_TYPES.NOT_FOUND, errorMessage || 'Resource not found.', null, ERROR_SEVERITY.MEDIUM);
  }
  if (status >= 500) {
    return createErrorResponse(ERROR_TYPES.SERVER, errorMessage || 'Server error. Please try again later.', null, ERROR_SEVERITY.HIGH);
  }
  if (status >= 400) {
    return createErrorResponse(ERROR_TYPES.VALIDATION, errorMessage, null, ERROR_SEVERITY.MEDIUM);
  }

  // Network errors
  if (errorCode === 'NETWORK_ERROR' || errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return createErrorResponse(ERROR_TYPES.NETWORK, 'Network error. Please check your connection and try again.', null, ERROR_SEVERITY.HIGH);
  }

  // Errors with response data (e.g. apiRequest sets error.data from JSON body)
  if (error?.data) {
    const safeDetails = sanitizeErrorData(error.data);
    return createErrorResponse(ERROR_TYPES.SERVER, error.data.message || error.data.error || errorMessage, safeDetails, ERROR_SEVERITY.MEDIUM);
  }

  // Generic errors (avoid attaching raw error to details; use status/message only)
  const safeGeneric = error && typeof error === 'object'
    ? { status: error.status, message: error.message }
    : null;
  return createErrorResponse(ERROR_TYPES.UNKNOWN, errorMessage, safeGeneric, ERROR_SEVERITY.MEDIUM);
};

export const handleApiError = (error, operation = 'API operation', options = {}) => {
  const { showToast = true, logError = true } = options;

  const errorResponse = parseApiError(error);

  if (logError) {
    logger.error(`[${operation}] Error:`, {
      error: errorResponse,
      operation,
      ...(error && typeof error === 'object' && { status: error.status, message: error.message })
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

/**
 * Wrapper for async API calls (fetch / apiRequest). Use for PERN backend calls.
 * Catches errors, optionally shows toast and logs, and rethrows parsed error.
 */
export const withApiErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      const result = await asyncFn(...args);
      const { successMessage, operationName = 'API call' } = options;
      if (successMessage) {
        handleSuccess(successMessage, result, operationName);
      }
      return result;
    } catch (error) {
      const { operationName = 'API call', showToast = true, logError = true } = options;
      throw handleApiError(error, operationName, { showToast, logError });
    }
  };
};


export const getErrorBoundaryInfo = (error, componentName = 'Component') => {
  const errorResponse = parseApiError(error);

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
