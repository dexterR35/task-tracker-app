/**
 * Centralized Form Utilities
 * Standardizes form handling patterns across the application
 */

import { showOperationSuccess, showOperationError, showValidationError } from './toast';
import { logger } from './logger';

/**
 * Standardized form submission handler
 * @param {Function} submitFn - The submission function
 * @param {Object} options - Form options
 * @returns {Function} Form submission handler
 */
export const createFormSubmissionHandler = (submitFn, options = {}) => {
  const {
    operation = 'save',
    resource = 'item',
    onSuccess = null,
    onError = null,
    showSuccessToast = true,
    showErrorToast = true
  } = options;

  return async (data, formMethods = {}) => {
    const { reset, setError, clearErrors } = formMethods;
    
    try {
      logger.log(`[Form] ${operation} started:`, data);
      
      const result = await submitFn(data);
      
      if (result?.error) {
        throw new Error(result.error.message || `${operation} failed`);
      }
      
      logger.log(`[Form] ${operation} success:`, result);
      
      // Show success toast
      if (showSuccessToast) {
        showOperationSuccess(operation, resource);
      }
      
      // Reset form
      if (reset) {
        reset();
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      logger.error(`[Form] ${operation} error:`, error);
      
      // Show error toast
      if (showErrorToast) {
        showOperationError(operation, resource, error.message);
      }
      
      // Handle form-specific errors
      if (error.field && setError) {
        setError(error.field, { message: error.message });
      } else if (error.errors && setError) {
        // Handle validation errors
        Object.entries(error.errors).forEach(([field, fieldError]) => {
          setError(field, { message: fieldError.message || fieldError });
        });
      }
      
      // Call error callback
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  };
};

/**
 * Standardized form validation handler
 * @param {Object} errors - Form validation errors
 * @param {string} formName - Name of the form
 * @returns {void}
 */
export const handleFormValidation = (errors, formName = 'Form') => {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount > 0) {
    logger.warn(`[${formName}] Validation errors:`, errors);
    showValidationError(errors);
  }
};

/**
 * Standardized form reset handler
 * @param {Object} formMethods - React Hook Form methods
 * @param {Object} defaultValues - Default form values
 * @returns {Function} Reset handler
 */
export const createFormResetHandler = (formMethods, defaultValues = {}) => {
  const { reset, clearErrors } = formMethods;
  
  return (newValues = {}) => {
    const valuesToReset = { ...defaultValues, ...newValues };
    reset(valuesToReset);
    clearErrors();
    logger.log('[Form] Reset with values:', valuesToReset);
  };
};

/**
 * Standardized form field change handler
 * @param {Object} formMethods - React Hook Form methods
 * @param {string} fieldName - Name of the field
 * @returns {Function} Field change handler
 */
export const createFieldChangeHandler = (formMethods, fieldName) => {
  const { setValue, trigger, clearErrors } = formMethods;
  
  return (value) => {
    setValue(fieldName, value);
    trigger(fieldName);
    clearErrors(fieldName);
  };
};

/**
 * Standardized conditional field logic
 * @param {Object} watchedValues - Form watched values
 * @param {Object} conditions - Field conditions
 * @returns {Object} Field visibility and requirements
 */
export const getConditionalFieldLogic = (watchedValues, conditions) => {
  const result = {};
  
  Object.entries(conditions).forEach(([fieldName, condition]) => {
    const { dependsOn, showWhen, requiredWhen } = condition;
    
    if (dependsOn && showWhen !== undefined) {
      result[`${fieldName}Visible`] = showWhen(watchedValues[dependsOn]);
    }
    
    if (dependsOn && requiredWhen !== undefined) {
      result[`${fieldName}Required`] = requiredWhen(watchedValues[dependsOn]);
    }
  });
  
  return result;
};

/**
 * Standardized form data preparation
 * @param {Object} data - Raw form data
 * @param {Object} options - Preparation options
 * @returns {Object} Prepared form data
 */
export const prepareFormData = (data, options = {}) => {
  const {
    removeEmptyFields = true,
    convertTypes = true,
    addMetadata = false
  } = options;
  
  let preparedData = { ...data };
  
  // Remove empty fields
  if (removeEmptyFields) {
    preparedData = Object.fromEntries(
      Object.entries(preparedData).filter(([_, value]) => {
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
      })
    );
  }
  
  // Convert types
  if (convertTypes) {
    Object.entries(preparedData).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // Convert numeric strings to numbers
        if (!isNaN(value) && !isNaN(parseFloat(value))) {
          preparedData[key] = parseFloat(value);
        }
        // Convert boolean strings
        else if (value === 'true' || value === 'false') {
          preparedData[key] = value === 'true';
        }
      }
    });
  }
  
  // Add metadata
  if (addMetadata) {
    preparedData.updatedAt = new Date().toISOString();
  }
  
  return preparedData;
};

/**
 * Standardized form error display
 * @param {Object} errors - Form errors
 * @param {string} fieldName - Field name
 * @returns {string|null} Error message
 */
export const getFieldError = (errors, fieldName) => {
  const error = errors[fieldName];
  return error?.message || null;
};

/**
 * Standardized form loading state
 * @param {boolean} isSubmitting - Form submission state
 * @param {boolean} isLoading - External loading state
 * @returns {Object} Loading state object
 */
export const getFormLoadingState = (isSubmitting, isLoading = false) => {
  return {
    isSubmitting,
    isLoading,
    isDisabled: isSubmitting || isLoading,
    loadingText: isSubmitting ? 'Saving...' : isLoading ? 'Loading...' : null
  };
};
