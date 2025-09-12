import React, { useMemo, useCallback } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { 
  TASK_FORM_CONFIG, 
  REPORTER_FORM_CONFIG
} from './configs/useForms';
import ReactHookFormWrapper from './ReactHookFormWrapper';
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/features/tasks/tasksApi';
import { useCreateReporterMutation, useUpdateReporterMutation } from '@/features/reporters/reportersApi';
import { logger } from '@/utils/logger';

/**
 * Universal Form Component using React Hook Form
 * Single component that handles CRUD forms in the application
 * For authentication, use the dedicated LoginPage component
 */
const UniversalFormRHF = ({
  formType, // 'task', 'reporter', etc. (NO login - use LoginPage instead)
  mode = 'create', // 'create' or 'edit'
  initialValues = null,
  onSuccess = null,
  onError = null,
  className = "",
  customMutations = null, // Override default mutations
  customContextData = null, // Override default context data
  // Pass data from parent to avoid duplicate useAppData calls
  user = null,
  monthId = null,
  reporters = [],
  ...additionalProps
}) => {
  // Only call useAppData if data not provided by parent - conditional fetching
  const appData = useAppData();
  const finalUser = user || appData.user;
  const finalMonthId = monthId || appData.monthId;
  const finalReporters = reporters.length > 0 ? reporters : appData.reporters;
  
  // Call RTK Query hooks at the top level
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();

  // Get form configuration based on type
  const formConfig = useMemo(() => {
    switch (formType) {
      case 'task':
        return TASK_FORM_CONFIG;
      case 'reporter':
        return REPORTER_FORM_CONFIG;
      default:
        throw new Error(`Unknown form type: ${formType}. Use LoginPage for authentication.`);
    }
  }, [formType]);

  // Get API mutations based on form type
  const apiMutations = useMemo(() => {
    if (customMutations) return customMutations;
    
    switch (formType) {
      case 'task':
        return {
          create: createTask,
          update: updateTask
        };
      case 'reporter':
        return {
          create: createReporter,
          update: updateReporter
        };
      default:
        throw new Error(`No API mutations available for form type: ${formType}`);
    }
  }, [formType, customMutations, createTask, updateTask, createReporter, updateReporter]);

  // Prepare context data based on form type
  const contextData = useMemo(() => {
    if (customContextData) return customContextData;
    
    const userUID = user?.userUID || user?.uid || user?.id;
    const userName = user?.name || user?.email || '';
    
    let context;
    switch (formType) {
      case 'task':
        context = {
          monthId: finalMonthId,
          user: finalUser, // Include full user object for permission checks
          // Include task ID and boardId for edit mode
          ...(mode === 'edit' && initialValues?.id && { 
            id: initialValues.id,
            taskId: initialValues.id,
            boardId: initialValues.boardId 
          })
        };
        break;
      case 'reporter':
        context = {
          createdBy: userUID || '',
          createdByName: userName
        };
        break;
      default:
        context = {};
    }
    
    return context;
  }, [formType, finalUser, finalMonthId, customContextData, mode, initialValues]);

  // Get initial values
  const formInitialValues = useMemo(() => {
    if (formType === 'reporter') {
      return formConfig.getInitialValues(finalUser, initialValues);
    }
    return formConfig.getInitialValues(initialValues);
  }, [formType, formConfig, finalUser, initialValues]);

  // Get fields with dynamic options
  const fieldsWithOptions = useMemo(() => {
    return formType === 'task' && formConfig.getFieldsWithOptions 
      ? formConfig.getFieldsWithOptions(finalReporters)
      : formConfig.fields;
  }, [formType, formConfig, finalReporters]);

  // Get form title and submit button text (memoized)
  const { formTitle, submitButtonText } = useMemo(() => {
    const titles = {
      task: mode === 'edit' ? 'Edit Task' : 'Create New Task',
      reporter: mode === 'edit' ? 'Edit Reporter' : 'Create New Reporter'
    };
    
    const buttonTexts = {
      task: mode === 'edit' ? 'Update Task' : 'Create Task',
      reporter: mode === 'edit' ? 'Update Reporter' : 'Create Reporter'
    };
    
    return {
      formTitle: titles[formType] || 'Form',
      submitButtonText: buttonTexts[formType] || 'Submit'
    };
  }, [formType, mode]);

  // Custom error handler for specific form types - memoized
  const handleError = useCallback((error) => {
    if (formType === 'reporter') {
      logger.error('Reporter form submission failed', { error });
    }
    onError?.(error);
  }, [formType, onError]);

  // Memoize form success handler
  const handleSuccess = useCallback((data) => {
    onSuccess?.(data);
  }, [onSuccess]);

  // All forms are wrapped in container
  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {formTitle}
      </h2>
      
      <ReactHookFormWrapper
        fields={fieldsWithOptions}
        initialValues={formInitialValues}
        formConfig={formConfig}
        mode={mode}
        apiMutations={apiMutations}
        contextData={contextData}
        onSuccess={handleSuccess}
        onError={handleError}
        entityType={formType}
        submitButtonText={submitButtonText}
        additionalProps={{
          ...additionalProps
        }}
      />
    </div>
  );
};

export default UniversalFormRHF;
