

import { showOperationSuccess, showOperationError, showValidationError } from '@/utils/toast';
import { logger } from '@/utils/logger';


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

      const result = await submitFn(data);

      if (result?.error) {
        throw new Error(result.error.message || `${operation} failed`);
      }


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


export const handleFormValidation = (errors, formName = 'Form') => {
  const errorCount = Object.keys(errors).length;

  if (errorCount > 0) {
    logger.warn(`[${formName}] Validation errors:`, errors);
    showValidationError(errors);
  }
};


export const createFormResetHandler = (formMethods, defaultValues = {}) => {
  const { reset, clearErrors } = formMethods;

  return (newValues = {}) => {
    const valuesToReset = { ...defaultValues, ...newValues };
    reset(valuesToReset);
    clearErrors();
  };
};


export const createFieldChangeHandler = (formMethods, fieldName) => {
  const { setValue, trigger, clearErrors } = formMethods;

  return (value) => {
    setValue(fieldName, value);
    trigger(fieldName);
    clearErrors(fieldName);
  };
};


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


export const prepareFormData = (data, options = {}) => {
  const {
    removeEmptyFields = true,
    convertTypes = true,
    addMetadata = false,
    lowercaseStrings = true,
    fieldsToLowercase = ['name', 'email', 'departament', 'country', 'channelName', 'products', 'observations', 'reporterName', 'departments', 'markets'],
    fieldsToKeepUppercase = ['taskName', 'reporters', 'userUID', 'reporterUID'] // Fields that should remain uppercase
  } = options;

  let preparedData = { ...data };

  // Apply lowercase transformation using consolidated function
  if (lowercaseStrings) {
    preparedData = transformDataToLowercase(preparedData, fieldsToLowercase, fieldsToKeepUppercase);
  }

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


export const transformDataToLowercase = (data, fieldsToLowercase = [], fieldsToKeepUppercase = ['taskName']) => {
  const transformedData = { ...data };

  // Handle top-level fields
  Object.entries(transformedData).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() !== '') {
      // Keep uppercase fields as-is
      if (fieldsToKeepUppercase.includes(key)) {
        transformedData[key] = value.trim();
      }
      // Lowercase specified fields (or all string fields if no specific fields provided)
      else if (fieldsToLowercase.length === 0 || fieldsToLowercase.includes(key)) {
        transformedData[key] = value.toLowerCase().trim();
      }
    }
    // Handle arrays of objects (like deliverablesUsed, aiUsed)
    else if (Array.isArray(value)) {
      transformedData[key] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          const transformedItem = { ...item };
          Object.entries(transformedItem).forEach(([itemKey, itemValue]) => {
            if (typeof itemValue === 'string' && itemValue.trim() !== '') {
              // Keep uppercase fields as-is
              if (fieldsToKeepUppercase.includes(itemKey)) {
                transformedItem[itemKey] = itemValue.trim();
              }
              // Lowercase specified fields (or all string fields if no specific fields provided)
              else if (fieldsToLowercase.length === 0 || fieldsToLowercase.includes(itemKey)) {
                transformedItem[itemKey] = itemValue.toLowerCase().trim();
              }
            }
          });
          return transformedItem;
        }
        return item;
      });
    }
  });

  return transformedData;
};

// Backward compatibility aliases
export const transformToLowercase = transformDataToLowercase;
export const transformNestedDataToLowercase = transformDataToLowercase;
