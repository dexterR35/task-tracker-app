// Form utility functions
import { PROTECTED_FIELDS, CONDITIONAL_FIELD_LOGIC } from './formConstants';

// Get user data from user object
export const getUserData = (user) => ({
  name: user?.name || user?.email || ''
});

// Execute mutation (handles both direct functions and RTK Query)
export const executeMutation = async (mutation, data) => {
  const result = mutation(data);
  return typeof result === 'object' && 'unwrap' in result 
    ? await result.unwrap() 
    : await result;
};

// Get mutation from API mutations object
export const getMutation = (apiMutations, type) => {
  const mutation = apiMutations[type] || apiMutations[`${type}Mutation`];
  if (!mutation) {
    throw new Error(`${type} mutation not provided`);
  }
  return mutation;
};

// Prepare form data for database submission
export const prepareFormData = (data, fields, formConfig, entityType, mode, contextData) => {
  // Sanitize form data
  const sanitizedData = sanitizeFormData(data, fields);
  
  // Use task-specific data preparation if this is a task form
  let processedData = sanitizedData;
  if (entityType === 'task' && formConfig.prepareTaskFormData) {
    processedData = formConfig.prepareTaskFormData(sanitizedData);
  }
  
  // Prepare data for database (exclude user object from contextData)
  const { user, ...contextDataWithoutUser } = contextData;
  const dataForDatabase = {
    ...processedData,
    ...contextDataWithoutUser
  };

  // Only add createdAt for new records (create mode)
  if (mode === 'create') {
    dataForDatabase.createdAt = new Date().toISOString();
  }

  // For update mode, remove protected fields that shouldn't be changed
  if (mode === 'edit') {
    PROTECTED_FIELDS.forEach(field => {
      delete dataForDatabase[field];
    });
  }

  // Remove id from dataForDatabase if it's null or undefined to let database generate it
  if (dataForDatabase.id === null || dataForDatabase.id === undefined) {
    delete dataForDatabase.id;
  }

  return dataForDatabase;
};

// Handle conditional field logic
export const handleConditionalLogic = (fieldName, checked, setValue, clearErrors) => {
  const logic = CONDITIONAL_FIELD_LOGIC[fieldName];
  if (!logic) return;

  if (!checked) {
    // Clear fields
    if (logic.clearFields) {
      logic.clearFields.forEach(field => {
        setValue(field, []);
      });
    }

    // Clear errors
    if (logic.clearErrors) {
      logic.clearErrors.forEach(field => {
        clearErrors(field);
      });
    }

    // Set specific values
    if (logic.setValues) {
      Object.entries(logic.setValues).forEach(([field, value]) => {
        setValue(field, value);
      });
    }
  }
};

// Get form metadata (title and button text)
export const getFormMetadata = (formType, mode, FORM_METADATA) => {
  const metadata = FORM_METADATA[formType];
  return {
    formTitle: metadata?.titles?.[mode] || 'Form',
    submitButtonText: metadata?.buttons?.[mode] || 'Submit'
  };
};

// Import sanitizeFormData from useForms
import { sanitizeFormData } from '../configs/useForms';
