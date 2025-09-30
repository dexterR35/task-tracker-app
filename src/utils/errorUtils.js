/**
 * Centralized Error Handling Utilities
 * Eliminates duplicate error handling patterns across the application
 */

import { logger } from './logger';
import { showError, showSuccess, showAuthError } from './toast';

/**
 * Standardized error response structure
 */
export const createErrorResponse = (message, code = 'UNKNOWN_ERROR', details = null) => ({
  success: false,
  error: {
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  }
});

/**
 * Standardized success response structure
 */
export const createSuccessResponse = (data, message = 'Operation successful') => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

/**
 * Handle API errors with consistent logging and user feedback
 * @param {Error} error - The error object
 * @param {string} context - Context where error occurred
 * @param {Object} options - Additional options
 * @returns {Object} Standardized error response
 */
export const handleApiError = (error, context = 'Unknown', options = {}) => {
  const {
    showToast = true,
    logError = true,
    fallbackMessage = 'An unexpected error occurred'
  } = options;

  // Log error for debugging
  if (logError) {
    logger.error(`[${context}] API Error:`, {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  // Determine error message
  let errorMessage = fallbackMessage;
  if (error.message) {
    errorMessage = error.message;
  } else if (error.error?.message) {
    errorMessage = error.error.message;
  }

  // Show toast notification
  if (showToast) {
    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      showAuthError(errorMessage);
    } else {
      showError(errorMessage);
    }
  }

  return createErrorResponse(errorMessage, 'API_ERROR', { context, originalError: error });
};

/**
 * Handle validation errors with consistent formatting
 * @param {Object} errors - Validation errors object
 * @param {string} formName - Name of the form
 * @returns {Object} Standardized error response
 */
export const handleValidationError = (errors, formName = 'Form') => {
  const errorMessages = Object.entries(errors).map(([field, error]) => {
    return `${field}: ${error.message || error}`;
  });

  const message = `${formName} validation failed: ${errorMessages.join(', ')}`;
  
  logger.warn(`[${formName}] Validation Error:`, errors);
  showError(message);

  return createErrorResponse(message, 'VALIDATION_ERROR', { errors, formName });
};

/**
 * Handle success operations with consistent feedback
 * @param {any} data - Success data
 * @param {string} message - Success message
 * @param {string} operation - Operation name
 * @returns {Object} Standardized success response
 */
export const handleSuccess = (data, message, operation = 'Operation') => {
  showSuccess(message);
  return createSuccessResponse(data, message);
};

/**
 * Wrap mutation functions with standardized error handling
 * @param {Function} mutationFn - The mutation function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped mutation function
 */
export const withMutationErrorHandling = (mutationFn, options = {}) => {
  const {
    operation = 'Mutation',
    showToast = true,
    logError = true
  } = options;

  return async (...args) => {
    try {
      const result = await mutationFn(...args);
      
      // Check if result contains an error
      if (result?.error) {
        throw new Error(result.error.message || 'Mutation failed');
      }
      
      return result;
    } catch (error) {
      return handleApiError(error, operation, { showToast, logError });
    }
  };
};

/**
 * Handle permission errors specifically
 * @param {string} action - Action that was attempted
 * @param {string} resource - Resource that was accessed
 * @returns {Object} Standardized error response
 */
export const handlePermissionError = (action, resource = 'resource') => {
  const message = `You do not have permission to ${action} ${resource}`;
  logger.warn(`[Permission] Access denied:`, { action, resource });
  showAuthError(message);
  return createErrorResponse(message, 'PERMISSION_DENIED', { action, resource });
};

/**
 * Handle network errors with retry logic
 * @param {Error} error - Network error
 * @param {Function} retryFn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} Retry attempt or error
 */
export const handleNetworkError = async (error, retryFn, maxRetries = 3) => {
  if (maxRetries <= 0) {
    return handleApiError(error, 'Network', { 
      showToast: true, 
      fallbackMessage: 'Network error: Please check your connection and try again' 
    });
  }

  logger.warn(`[Network] Retrying... (${maxRetries} attempts left):`, error.message);
  
  // Wait before retry (exponential backoff)
  await new Promise(resolve => setTimeout(resolve, 1000 * (4 - maxRetries)));
  
  try {
    return await retryFn();
  } catch (retryError) {
    return handleNetworkError(retryError, retryFn, maxRetries - 1);
  }
};

/**
 * Validate error response structure
 * @param {any} response - Response to validate
 * @returns {boolean} True if response is a valid error
 */
export const isErrorResponse = (response) => {
  return response && 
         typeof response === 'object' && 
         response.success === false && 
         response.error && 
         typeof response.error.message === 'string';
};

/**
 * Extract error message from various error formats
 * @param {any} error - Error object
 * @returns {string} Extracted error message
 */
export const extractErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error?.message) return error.error.message;
  if (error?.data?.message) return error.data.message;
  return 'An unknown error occurred';
};
