// Form utility functions
import { PROTECTED_FIELDS } from './formConstants';

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
  // Apply business logic processing (React Hook Form + Yup handle validation/sanitization)
  const processedData = entityType === 'task' && formConfig.prepareTaskFormData
    ? formConfig.prepareTaskFormData(data)
    : data;
  
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

// Note: Removed handleConditionalLogic - using Yup .when() for conditional validation instead

// Get form metadata (title and button text)
export const getFormMetadata = (formType, mode, FORM_METADATA) => {
  const metadata = FORM_METADATA[formType];
  return {
    formTitle: metadata?.titles?.[mode] || 'Form',
    submitButtonText: metadata?.buttons?.[mode] || 'Submit'
  };
};

// Note: All validation logic moved to explicit Yup schemas in useForms.js
