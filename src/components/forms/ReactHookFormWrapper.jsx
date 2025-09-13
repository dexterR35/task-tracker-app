import React, { useCallback, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { showSuccess, showError } from '@/utils/toast';
import { buildFormValidationSchema, shouldShowField } from './configs/useForms';
import { 
  TextField, 
  SelectField, 
  CheckboxField, 
  NumberField, 
  UrlField, 
  MultiSelectField 
} from './components';
import { 
  INPUT_TYPE_MAP, 
  FORM_METADATA 
} from './utils/formConstants';
import { 
  executeMutation, 
  getMutation, 
  prepareFormData 
} from './utils/formUtilities';

/**
 * React Hook Form Wrapper Component
 * Centralized form component using React Hook Form v7
 * Works with any field configuration from useForms.js
 * Supports any CRUD operations through apiMutations
 * 
 * @param {Object} props - Component props
 * @param {Array} props.fields - Field configuration array from useForms.js
 * @param {Function} props.onSubmit - Form submission handler (optional - can use built-in handlers)
 * @param {Object} props.initialValues - Initial form values
 * @param {Object} props.validationSchema - Yup validation schema (optional - auto-generated from fields)
 * @param {string} props.submitButtonText - Text for submit button
 * @param {boolean} props.isSubmitting - Loading state
 * @param {Object} props.additionalProps - Additional props to pass to form
 * @param {Object} props.formConfig - Complete form configuration object
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onError - Error callback
 * @param {string} props.mode - Form mode ('create' or 'edit')
 * @param {Object} props.apiMutations - API mutation functions { create, update }
 * @param {Object} props.contextData - Additional context data (user, monthId, etc.)
 * @param {string} props.entityType - Entity type for logging/debugging (optional)
 */
const ReactHookFormWrapper = ({
  fields,
  onSubmit,
  initialValues,
  validationSchema,
  submitButtonText = 'Submit',
  isSubmitting = false,
  additionalProps = {},
  formConfig = null,
  onSuccess = null,
  onError = null,
  mode = 'create',
  apiMutations = {},
  contextData = {},
  entityType = 'record'
}) => {
  // Auto-generate validation schema if not provided - optimized for React Hook Form
  const finalValidationSchema = useMemo(() => {
    if (validationSchema) return validationSchema;
    if (formConfig?.validationSchema) return formConfig.validationSchema;
    if (fields) {
      return buildFormValidationSchema(fields);
    }
    return null;
  }, [validationSchema, formConfig, fields]);

  // Initialize React Hook Form
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting: formIsSubmitting },
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    trigger
  } = useForm({
    resolver: finalValidationSchema ? yupResolver(finalValidationSchema) : undefined,
    defaultValues: initialValues,
    mode: 'onChange',
    ...additionalProps
  });

  // Watch all form values for conditional field logic
  const watchedValues = watch();

  // Auto-generate taskName from jiraLink for task forms (real-time)
  useEffect(() => {
    if (entityType === 'task' && watchedValues.jiraLink) {
      const jiraMatch = watchedValues.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
      if (jiraMatch) {
        const generatedTaskName = jiraMatch[1]; // e.g., "GIMODEAR-124124"
        setValue('taskName', generatedTaskName);
        console.log('🔧 Auto-generated taskName:', generatedTaskName);
      } else if (watchedValues.jiraLink.includes('atlassian.net')) {
        // Fallback: use the last part of the URL for valid Jira URLs
        const urlParts = watchedValues.jiraLink.split('/');
        const fallbackTaskName = urlParts[urlParts.length - 1] || 'Unknown Task';
        setValue('taskName', fallbackTaskName);
        console.log('🔧 Auto-generated taskName (fallback):', fallbackTaskName);
      } else {
        // Clear taskName if Jira link is invalid or empty
        setValue('taskName', '');
        console.log('🔧 Cleared taskName - invalid Jira link');
      }
    }
  }, [watchedValues.jiraLink, entityType, setValue]);


  // Helper function to get input type - memoized
  const getInputType = useCallback((fieldType) => {
    return INPUT_TYPE_MAP[fieldType] || 'text';
  }, []);

  // Memoize form submission handler
  const handleFormSubmit = useCallback(async (data) => {
    try {
      // Debug logging for form submission
      console.log('🚀 Form Submission Started:', {
        mode,
        rawFormData: data,
        contextData
      });

      // Use custom onSubmit if provided, otherwise use built-in logic
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      // Built-in form submission logic
      if (!formConfig || !apiMutations) {
        showError('Form configuration or API mutations not provided');
        return;
      }

      // Prepare form data for database
      const dataForDatabase = prepareFormData(data, fields, formConfig, entityType, mode, contextData);
      console.log('💾 Final Data for Database:', dataForDatabase);

      let result;
      if (mode === 'edit' && contextData.id) {
        // Update existing record
        const updateMutation = getMutation(apiMutations, 'update');
        const mutationData = {
          monthId: contextData.monthId,
          boardId: contextData.boardId,
          taskId: contextData.taskId || contextData.id,
          updates: dataForDatabase,
          userData: contextData.user
        };
        
        result = await executeMutation(updateMutation, mutationData);
        console.log('✅ Update Result:', result);
        showSuccess(formConfig.successMessages?.update || `${entityType} updated successfully!`);
      } else {
        // Create new record
        const createMutation = getMutation(apiMutations, 'create');
        const mutationData = {
          task: dataForDatabase,
          userData: contextData.user
        };
        
        result = await executeMutation(createMutation, mutationData);
        showSuccess(formConfig.successMessages?.create || `${entityType} created successfully!`);
      }

      // Reset form
      reset();
      
      // Call success callback if provided
      onSuccess?.(result);

    } catch (error) {
      console.error(`${entityType} form submission error:`, error);
      const errorMessage = formConfig?.errorMessages?.default || `Failed to save ${entityType}. Please try again.`;
      showError(errorMessage);
      onError?.(error);
    }
  }, [onSubmit, formConfig, apiMutations, contextData, mode, fields, onSuccess, onError, entityType, reset]);

  /**
   * Generic field renderer that works with any field configuration
   * Memoized to prevent unnecessary re-renders
   */
  const renderField = useCallback((field) => {
    // Check if field should be visible based on conditional logic
    if (!shouldShowField(field, watchedValues)) {
      return null; // Don't render the field
    }

    const fieldProps = {
      field,
      register,
      errors,
      setValue,
      watch,
      trigger,
      clearErrors,
      getInputType
    };

    switch (field.type) {
      case 'select':
        return <SelectField key={field.name} {...fieldProps} />;
      case 'multiSelect':
        return <MultiSelectField key={field.name} {...fieldProps} />;
      case 'checkbox':
        return <CheckboxField key={field.name} {...fieldProps} />;
      case 'number':
        return <NumberField key={field.name} {...fieldProps} />;
      case 'url':
        return <UrlField key={field.name} {...fieldProps} />;
      default:
        return <TextField key={field.name} {...fieldProps} />;
    }
  }, [watchedValues, errors, register, setValue, trigger, clearErrors, getInputType]);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {fields?.map((field) => renderField(field)) || []}
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || formIsSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(isSubmitting || formIsSubmitting) ? 'Submitting...' : submitButtonText}
        </button>
      </div>
    </form>
  );
};



// Memoize the component to prevent unnecessary re-renders
export default React.memo(ReactHookFormWrapper);
