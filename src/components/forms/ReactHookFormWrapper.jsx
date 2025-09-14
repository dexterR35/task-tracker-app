import React, { useCallback, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { showSuccess, showError } from '@/utils/toast';
import { buildFormValidationSchema, shouldShowField, TASK_FORM_CONFIG, REPORTER_FORM_CONFIG, LOGIN_FORM_CONFIG } from './configs/useForms';
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
  getUserData,
  getFormMetadata
} from './utils/formUtilities';
import { useAppData } from '@/hooks/useAppData';
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/features/tasks/tasksApi';
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
  // Only call useAppData if data not provided by parent - conditional fetching
  const appData = (!user || !monthId || reporters.length === 0) ? useAppData() : null;
  const finalUser = user || appData?.user;
  const finalMonthId = monthId || appData?.monthId;
  const finalReporters = reporters.length > 0 ? reporters : appData?.reporters || [];
  
  // Get task mutations from useAppData or fallback to direct hooks
  const createTask = appData?.createTask || useCreateTaskMutation()[0];
  const updateTask = appData?.updateTask || useUpdateTaskMutation()[0];
  
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
  const finalFormConfig = useMemo(() => {
    if (formType) {
      const config = FORM_CONFIGS[formType];
      if (!config) {
        throw new Error(`Unknown form type: ${formType}. Supported types: task, reporter, login`);
      }
      return config;
    }
    return formConfig;
  }, [formType, formConfig]);

  // API mutations mapping
  const API_MUTATIONS = {
    task: {
      create: createTask,
      update: updateTask
    },
    reporter: {
      create: createReporter,
      update: updateReporter
    },
    login: {
      create: login, // Login is a "create" operation (create session)
      update: null   // Login doesn't have update
    }
  };

  // Get API mutations based on form type
  const finalApiMutations = useMemo(() => {
    if (customMutations) return customMutations;
    if (formType) {
      const mutations = API_MUTATIONS[formType];
      if (!mutations) {
        throw new Error(`No API mutations available for form type: ${formType}`);
      }
      return mutations;
    }
    return apiMutations;
  }, [formType, customMutations, apiMutations, createTask, updateTask, createReporter, updateReporter, login]);

  // Prepare context data based on form type
  const finalContextData = useMemo(() => {
    if (customContextData) return customContextData;
    
    const userData = getUserData(finalUser);
    
    const baseContext = {
      user: finalUser,
      ...userData
    };
    
    if (formType === 'task') {
      return {
        ...baseContext,
        monthId: finalMonthId,
        ...(mode === 'edit' && initialValues?.id && { 
          id: initialValues.id,
          taskId: initialValues.id,
          boardId: initialValues.boardId 
        })
      };
    }
    
    if (formType === 'reporter') {
      return {
        ...baseContext,
        ...(mode === 'edit' && initialValues?.id && { 
          id: initialValues.id
        })
      };
    }
    
    if (formType === 'login') {
      return {
        // Login doesn't need context data
        user: null
      };
    }
    
    return { ...baseContext, ...contextData };
  }, [formType, finalUser, finalMonthId, customContextData, mode, initialValues, contextData]);

  // Get initial values
  const finalInitialValues = useMemo(() => {
    if (formType === 'reporter') {
      const values = finalFormConfig.getInitialValues(finalUser, initialValues);
      logger.log('📝 Reporter initial values:', values, 'from:', initialValues);
      logger.log('📝 Final user:', finalUser);
      logger.log('📝 Mode:', mode);
      return values;
    }
    if (formType === 'login') {
      return finalFormConfig.getInitialValues();
    }
    if (formType === 'task') {
      return finalFormConfig.getInitialValues(initialValues);
    }
    return initialValues;
  }, [formType, finalFormConfig, finalUser, initialValues, mode]);

  // Get fields with dynamic options
  const finalFields = useMemo(() => {
    if (formType === 'task' && finalFormConfig.getFieldsWithOptions) {
      return finalFormConfig.getFieldsWithOptions(finalReporters);
    }
    if (formType) {
      return finalFormConfig.fields;
    }
    return fields;
  }, [formType, finalFormConfig, finalReporters, fields]);

  // Get form title and submit button text (memoized)
  const { formTitle, finalSubmitButtonText } = useMemo(() => {
    if (formType) {
      const metadata = getFormMetadata(formType, mode, FORM_METADATA);
      return {
        formTitle: metadata.formTitle,
        finalSubmitButtonText: submitButtonText || metadata.submitButtonText
      };
    }
    return {
      formTitle: null,
      finalSubmitButtonText: submitButtonText
    };
  }, [formType, mode, submitButtonText]);

  // Auto-generate validation schema if not provided - optimized for React Hook Form
  const finalValidationSchema = useMemo(() => {
    if (validationSchema) return validationSchema;
    if (finalFormConfig?.validationSchema) return finalFormConfig.validationSchema;
    if (finalFields) {
      return buildFormValidationSchema(finalFields);
    }
    return null;
  }, [validationSchema, finalFormConfig, finalFields]);

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
    mode: 'onChange',
    ...additionalProps
  });

  // Watch all form values for conditional field logic
  const watchedValues = watch();

  // Auto-generate taskName from jiraLink for task forms (real-time)
  useEffect(() => {
    if ((formType === 'task' || entityType === 'task') && watchedValues.jiraLink) {
      const jiraMatch = watchedValues.jiraLink.match(/\/browse\/([A-Z]+-\d+)/);
      if (jiraMatch) {
        const generatedTaskName = jiraMatch[1]; // e.g., "GIMODEAR-124124"
        setValue('taskName', generatedTaskName);
        logger.log('🔧 Auto-generated taskName:', generatedTaskName);
      } else if (watchedValues.jiraLink.includes('atlassian.net')) {
        // Fallback: use the last part of the URL for valid Jira URLs
        const urlParts = watchedValues.jiraLink.split('/');
        const fallbackTaskName = urlParts[urlParts.length - 1] || 'Unknown Task';
        setValue('taskName', fallbackTaskName);
        logger.log('🔧 Auto-generated taskName (fallback):', fallbackTaskName);
      } else {
        // Clear taskName if Jira link is invalid or empty
        setValue('taskName', '');
        logger.log('🔧 Cleared taskName - invalid Jira link');
      }
    }
  }, [watchedValues.jiraLink, formType, entityType, setValue]);

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
        contextData
      });

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
      const dataForDatabase = prepareFormData(data, finalFields, finalFormConfig, formType || entityType, mode, finalContextData);
      console.log('💾 Final Data for Database:', dataForDatabase);
      console.log('💾 Form Data (raw):', data);
      console.log('💾 Context Data:', finalContextData);
      logger.log('💾 Final Data for Database:', dataForDatabase);
      logger.log('💾 Form Data (raw):', data);
      logger.log('💾 Context Data:', finalContextData);

      let result;
      if (mode === 'edit' && finalContextData.id) {
        // Update existing record
        const updateMutation = getMutation(finalApiMutations, 'update');
        let mutationData;
        
        if (formType === 'reporter') {
          mutationData = {
            id: finalContextData.id,
            updates: dataForDatabase
          };
        } else {
          mutationData = {
            monthId: finalContextData.monthId,
            taskId: finalContextData.taskId || finalContextData.id,
            updates: dataForDatabase
          };
        }
        
        result = await executeMutation(updateMutation, mutationData);
        logger.log('✅ Update Result:', result);
        showSuccess(finalFormConfig.successMessages?.update || `${formType || entityType} updated successfully!`);
      } else {
        // Create new record
        const createMutation = getMutation(finalApiMutations, 'create');
        
        // Special handling for login form
        if (formType === 'login') {
          // For login, pass the raw form data directly to the login function
          logger.log('🔐 Login form data:', data);
          result = await executeMutation(createMutation, data);
        } else {
          // For other forms, use the standard data preparation
          let mutationData;
          if (formType === 'reporter') {
            mutationData = {
              reporter: dataForDatabase,
              userData: finalContextData.user
            };
          } else {
            mutationData = {
              task: dataForDatabase,
              userData: finalContextData.user
            };
          }
          result = await executeMutation(createMutation, mutationData);
        }
        
        showSuccess(finalFormConfig.successMessages?.create || `${formType || entityType} created successfully!`);
      }

      // Reset form
      reset();
      
      // Call success callback if provided
      onSuccess?.(result);

    } catch (error) {
      logger.error(`${entityType} form submission error:`, error);
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
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      {formTitle && (
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {formTitle}
        </h2>
      )}
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className={formType === 'task' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-6"}>
        {finalFields?.map((field) => renderField(field)) || []}
        
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
