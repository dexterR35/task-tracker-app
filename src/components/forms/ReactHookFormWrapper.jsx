import React, { useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { showSuccess, showError } from '@/utils/toast';
import { shouldShowField, TASK_FORM_CONFIG, REPORTER_FORM_CONFIG, LOGIN_FORM_CONFIG } from './configs/useForms';
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
  prepareFormData,
  getFormMetadata
} from './utils/formUtilities';
import { useAppData } from '@/hooks/useAppData';
import { useCreateReporterMutation, useUpdateReporterMutation } from '@/features/reporters/reportersApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logger } from '@/utils/logger';

/**
 * Universal Form Component using React Hook Form
 * Single component that handles all forms in the application
 * Supports CRUD forms (task, reporter) and authentication (login)
 * 
 * @param {Object} props - Component props
 * @param {string} props.formType - Form type ('task', 'reporter', 'login') - if provided, uses built-in config
 * @param {Array} props.fields - Field configuration array from useForms.js (if not using formType)
 * @param {Function} props.onSubmit - Form submission handler (optional - can use built-in handlers)
 * @param {Object} props.initialValues - Initial form values
 * @param {Object} props.validationSchema - Yup validation schema (optional - auto-generated from fields)
 * @param {string} props.submitButtonText - Text for submit button
 * @param {boolean} props.isSubmitting - Loading state
 * @param {Object} props.additionalProps - Additional props to pass to form
 * @param {Object} props.formConfig - Complete form configuration object (if not using formType)
 * @param {Function} props.onSuccess - Success callback
 * @param {Function} props.onError - Error callback
 * @param {string} props.mode - Form mode ('create' or 'edit')
 * @param {Object} props.apiMutations - API mutation functions { create, update } (if not using formType)
 * @param {Object} props.contextData - Additional context data (user, monthId, etc.)
 * @param {string} props.entityType - Entity type for logging/debugging (optional)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.customMutations - Override default mutations
 * @param {Object} props.customContextData - Override default context data
 * @param {Object} props.user - User data (to avoid duplicate useAppData calls)
 * @param {string} props.monthId - Month ID (to avoid duplicate useAppData calls)
 * @param {Array} props.reporters - Reporters data (to avoid duplicate useAppData calls)
 */
const ReactHookFormWrapper = ({
  formType = null, // New: form type for built-in configs
  fields = null,
  onSubmit = null,
  initialValues = null,
  validationSchema = null,
  submitButtonText = 'Submit',
  isSubmitting = false,
  additionalProps = {},
  formConfig = null,
  onSuccess = null,
  onError = null,
  mode = 'create',
  apiMutations = {},
  contextData = {},
  entityType = 'record',
  className = "",
  customMutations = null,
  customContextData = null,
  user = null,
  monthId = null,
  reporters = []
}) => {
  // Always call useAppData to maintain consistent hook order
  const appData = useAppData();
  
  // Use provided data if available, otherwise fallback to appData
  const finalUser = user || appData?.user;
  const finalMonthId = monthId || appData?.monthId;
  const finalReporters = reporters.length > 0 ? reporters : appData?.reporters || [];
  
  // Get task mutations from useAppData
  const createTask = appData?.createTask;
  const updateTask = appData?.updateTask;
  
  // Call RTK Query hooks at the top level
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();
  
  // Auth hook for login
  const { login } = useAuth();

  // Form configuration mapping
  const FORM_CONFIGS = {
    task: TASK_FORM_CONFIG,
    reporter: REPORTER_FORM_CONFIG,
    login: LOGIN_FORM_CONFIG
  };

  // Get form configuration based on type
  const finalFormConfig = formType
    ? (() => {
        const config = FORM_CONFIGS[formType];
        if (!config) {
          throw new Error(`Unknown form type: ${formType}. Supported types: task, reporter, login`);
        }
        return config;
      })()
    : formConfig;

  // Get API mutations from form config
  const finalApiMutations = customMutations || (finalFormConfig?.getApiMutations 
    ? finalFormConfig.getApiMutations(appData, createReporter, updateReporter, login)
    : apiMutations);

  // Get context data from form config
  const finalContextData = customContextData || (finalFormConfig?.getContextData
    ? finalFormConfig.getContextData(finalUser, finalMonthId, initialValues, mode)
    : contextData);

  // Get initial values from form config
  const finalInitialValues = finalFormConfig?.getInitialValues
    ? finalFormConfig.getInitialValues(finalUser, initialValues)
    : initialValues;

  // Get fields from form config
  const finalFields = finalFormConfig?.getFieldsWithOptions
    ? finalFormConfig.getFieldsWithOptions(finalReporters)
    : finalFormConfig?.fields || fields;

  // Get form title and submit button text
  const { formTitle, finalSubmitButtonText } = formType
    ? (() => {
        const metadata = getFormMetadata(formType, mode, FORM_METADATA);
        return {
          formTitle: metadata.formTitle,
          finalSubmitButtonText: submitButtonText || metadata.submitButtonText
        };
      })()
    : {
        formTitle: null,
        finalSubmitButtonText: submitButtonText
      };

  // Get validation schema - use explicit schema from form config
  const finalValidationSchema = validationSchema || finalFormConfig?.validationSchema;
  
  // Debug validation schema
  if (finalValidationSchema) {
    logger.log('✅ Validation schema created:', finalValidationSchema);
  } else {
    logger.error('❌ No validation schema found!');
  }

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
    defaultValues: finalInitialValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldFocusError: true,
    ...additionalProps
  });

  // Watch all form values for conditional field logic
  const watchedValues = watch();


  // Reset form when initialValues change (for edit mode)
  useEffect(() => {
    if (finalInitialValues && mode === 'edit') {
      reset(finalInitialValues);
      logger.log('🔄 Form reset with new initial values:', finalInitialValues);
      logger.log('🔄 Mode:', mode, 'FormType:', formType);
      logger.log('🔄 Initial values passed to form:', initialValues);
    }
  }, [finalInitialValues, mode, reset, formType, initialValues]);

  // Helper function to get input type - memoized
  const getInputType = useCallback((fieldType) => {
    return INPUT_TYPE_MAP[fieldType] || 'text';
  }, []);

  // Memoize form submission handler
  const handleFormSubmit = useCallback(async (data) => {
    try {
      // Debug logging for form submission
      logger.log('🚀 Form Submission Started:', {
        mode,
        rawFormData: data,
        contextData,
        validationSchema: finalValidationSchema ? 'Present' : 'Missing',
        fields: finalFields?.length || 0,
        formErrors: errors
      });
      
      console.log('🚀 Form submission data:', data);
      console.log('🚀 Form errors:', errors);

      // Check if validation schema exists
      if (!finalValidationSchema) {
        logger.error('❌ No validation schema found!');
        showError('Form validation is not configured properly');
        return;
      }

      // Log the actual data being submitted
      logger.log('📝 Form data being submitted:', data);

      // Note: React Hook Form with Yup validation handles all validation automatically
      // No need for manual validation checks here

      // Use custom onSubmit if provided, otherwise use built-in logic
      if (onSubmit) {
        await onSubmit(data);
        return;
      }

      // Built-in form submission logic
      if (!finalFormConfig || !finalApiMutations) {
        showError('Form configuration or API mutations not provided');
        return;
      }

      // Prepare form data for database
      let dataForDatabase;
      try {
        dataForDatabase = prepareFormData(data, finalFields, finalFormConfig, formType || entityType, mode, finalContextData);
        logger.log('💾 Final Data for Database:', dataForDatabase);
        logger.log('💾 Form Data (raw):', data);
        logger.log('💾 Context Data:', finalContextData);
      } catch (error) {
        logger.error('💾 Data preparation error:', error);
        showError(error.message);
        return;
      }

      let result;
      if (mode === 'edit' && finalContextData.id) {
        // Update existing record
        const updateMutation = getMutation(finalApiMutations, 'update');
        const mutationData = formType === 'reporter' 
          ? { id: finalContextData.id, updates: dataForDatabase }
          : { 
              monthId: finalContextData.monthId, 
              taskId: finalContextData.taskId || finalContextData.id, 
              updates: dataForDatabase, 
              reporters: finalReporters 
            };
        
        result = await executeMutation(updateMutation, mutationData);
        logger.log('✅ Update Result:', result);
        showSuccess(finalFormConfig.successMessages?.update || `${formType || entityType} updated successfully!`);
      } else {
        // Create new record
        const createMutation = getMutation(finalApiMutations, 'create');
        const mutationData = formType === 'login' 
          ? data // Login uses raw form data
          : formType === 'reporter' 
            ? { reporter: dataForDatabase, userData: finalContextData.user }
            : { task: dataForDatabase, userData: finalContextData.user, reporters: finalReporters };
        
        result = await executeMutation(createMutation, mutationData);
        showSuccess(finalFormConfig.successMessages?.create || `${formType || entityType} created successfully!`);
      }

      // Reset form
      reset();
      
      // Call success callback if provided
      onSuccess?.(result);

    } catch (error) {
      logger.error(`${entityType} form submission error:`, error);
      const errorMessage = finalFormConfig?.errorMessages?.default || `Failed to save ${entityType}. Please try again.`;
      showError(errorMessage);
      onError?.(error);
    }
  }, [onSubmit, finalFormConfig, finalApiMutations, finalContextData, mode, finalFields, onSuccess, onError, entityType, reset, formType, finalReporters, finalValidationSchema]);

  /**
   * Generic field renderer that works with any field configuration
   * Memoized to prevent unnecessary re-renders
   */
  const renderField = useCallback((field) => {
    // All fields are now visible - conditional logic only affects required state

    const fieldProps = {
      field,
      register,
      errors,
      setValue,
      watch,
      trigger,
      clearErrors,
      getInputType,
      formValues: watchedValues
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
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      {formTitle && (
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {formTitle}
        </h2>
      )}
      
      <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
        console.log('❌ Form validation errors:', errors);
        logger.error('❌ Form validation failed:', errors);
        showError('Please fix the validation errors before submitting');
      })} className={formType === 'task' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6"}>
        {finalFields?.map((field) => {
          logger.log('🔍 Rendering field:', field.name, 'type:', field.type, 'required:', field.required);
          return renderField(field);
        }) || []}
        
        <div className={formType === 'task' ? "col-span-1 lg:col-span-2 flex justify-end" : "flex justify-end"}>
          <button
            type="submit"
            disabled={isSubmitting || formIsSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(isSubmitting || formIsSubmitting) ? 'Submitting...' : finalSubmitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
};



// Memoize the component to prevent unnecessary re-renders
export default React.memo(ReactHookFormWrapper);
