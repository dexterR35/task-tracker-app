import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAppData } from '@/hooks/useAppData';
import { showSuccess, showError, showAuthError } from '@/utils/toast';
import { handleValidationError, handleSuccess, withMutationErrorHandling } from '@/utils/errorUtils';
import { createFormSubmissionHandler, handleFormValidation, prepareFormData } from '@/utils/formUtils';
import { 
  taskFormSchema, 
  TASK_FORM_FIELDS, 
  prepareTaskFormData
} from '../../config/useTaskForm';
import { shouldShowField } from '../../../../components/forms/configs/sharedFormUtils';
import { 
  TextField, 
  TextareaField,
  SelectField, 
  MultiSelectField, 
  NumberField, 
  CheckboxField,
  SimpleDateField 
} from '../../../../components/forms/components';
import DeliverablesField from '../../../../components/forms/components/DeliverablesField';
import { getInputType } from '../../../../components/forms/configs/sharedFormUtils';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { logger } from '@/utils/logger';
// Permission validation now happens at API level

/**
 * Dedicated Task Form Component
 * Handles creating and updating task records with conditional field logic
 */
const TaskForm = ({ 
  mode = 'create', 
  initialData = null, 
  onSuccess, 
  className = "" 
}) => {
  const { createTask, updateTask, reporters = [], monthId, user } = useAppData();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
    trigger,
    clearErrors,
    setError
  } = useForm({
    resolver: yupResolver(taskFormSchema),
    defaultValues: {
      jiraLink: '',
      products: '',
      departments: '',
      markets: [],
      timeInHours: '',
      startDate: '',
      endDate: '',
      _hasDeliverables: false,
      deliverables: [],
      customDeliverables: [],
      _usedAIEnabled: false,
      aiModels: [],
      aiTime: 0,
      isVip: false,
      reworked: false,
      reporters: '',
      observations: ''
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  // Watch all form values for conditional field logic
  const watchedValues = watch();

  // Watch checkbox values to clear errors when unchecked
  const hasDeliverables = watch('_hasDeliverables');
  const usedAIEnabled = watch('_usedAIEnabled');

  // Clear validation errors and uncheck deliverables when checkbox is unchecked
  useEffect(() => {
    if (!hasDeliverables) {
      clearErrors('deliverables');
      clearErrors('customDeliverables');
      // Uncheck all deliverables when "Has Deliverables" is unchecked
      setValue('deliverables', []);
      setValue('customDeliverables', []);
    }
  }, [hasDeliverables, clearErrors, setValue]);

  useEffect(() => {
    if (!usedAIEnabled) {
      clearErrors('aiModels');
      clearErrors('aiTime');
    }
  }, [usedAIEnabled, clearErrors]);

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Handle nested data_task structure from database
      const taskData = initialData.data_task || initialData;
      
      // Reconstruct jiraLink from taskName for editing
      const jiraLink = taskData.taskName ? 
        `https://gmrd.atlassian.net/browse/${taskData.taskName}` : 
        (taskData.jiraLink || '');
      
      // Handle various date formats for form display
      const formatDate = (dateValue) => {
        if (!dateValue) return '';
        
        // If it's already a string in YYYY-MM-DD format, return as-is
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        
        // If it's an ISO string, convert to YYYY-MM-DD
        if (typeof dateValue === 'string' && dateValue.includes('T')) {
          return new Date(dateValue).toISOString().split('T')[0];
        }
        
        // If it's a Firestore Timestamp object
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate().toISOString().split('T')[0];
        }
        
        // If it's a Firestore Timestamp-like object with seconds
        if (dateValue.seconds) {
          return new Date(dateValue.seconds * 1000).toISOString().split('T')[0];
        }
        
        // If it's a Date object
        if (dateValue instanceof Date) {
          return dateValue.toISOString().split('T')[0];
        }
        
        return '';
      };
      
      const formattedStartDate = formatDate(taskData.startDate);
      const formattedEndDate = formatDate(taskData.endDate);
      
      reset({
        jiraLink: jiraLink,
        products: taskData.products || '',
        departments: taskData.departments || '',
        markets: taskData.markets || [],
        timeInHours: taskData.timeInHours || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        _hasDeliverables: (taskData.deliverables && taskData.deliverables.length > 0) || false,
        deliverables: taskData.deliverables || [],
        _usedAIEnabled: (taskData.aiModels && taskData.aiModels.length > 0) || false,
        aiModels: taskData.aiModels || [],
        aiTime: taskData.aiTime || 0,
        reporters: taskData.reporters || ''
      });
      
      logger.log('🔄 Task form reset with initial data:', { 
        initialData, 
        taskData,
        dateConversion: {
          originalStartDate: taskData.startDate,
          formattedStartDate: formattedStartDate,
          originalEndDate: taskData.endDate,
          formattedEndDate: formattedEndDate
        }
      });
    }
  }, [initialData, mode, reset]);

  // Create standardized form submission handler
  const handleFormSubmit = createFormSubmissionHandler(
    async (data) => {
      // Additional validation for conditional fields
      if (data._hasDeliverables && (!data.deliverables || data.deliverables.length === 0)) {
        throw new Error('Please select at least one deliverable when "Has Deliverables" is checked');
      }
      
      // Validate custom deliverables when "others" is selected
      if (data._hasDeliverables && data.deliverables?.includes('others')) {
        if (!data.customDeliverables || data.customDeliverables.length === 0) {
          throw new Error('Please add at least one custom deliverable when "Others" is selected');
        }
      }
      
      if (data._usedAIEnabled) {
        if (!data.aiModels || data.aiModels.length === 0) {
          throw new Error('Please select at least one AI model when "AI Tools Used" is checked');
        }
        if (!data.aiTime || data.aiTime <= 0) {
          throw new Error('Please enter a valid AI time when "AI Tools Used" is checked');
        }
      }
      
      // Prepare form data for database
      const processedData = prepareTaskFormData(data);
      logger.log('💾 Processed task data:', processedData);
      
      if (mode === 'edit' && initialData?.id) {
        // Update existing task
        const updateTaskWithErrorHandling = withMutationErrorHandling(updateTask, {
          operation: 'Update Task',
          showToast: false,
          logError: true
        });
        
        return await updateTaskWithErrorHandling({
          monthId: initialData.monthId,
          taskId: initialData.id,
          updates: processedData,
          reporters,
          userData: user
        });
      } else {
        // Create new task
        const taskWithMonthId = {
          ...processedData,
          monthId: monthId
        };
        
        const createTaskWithErrorHandling = withMutationErrorHandling(createTask, {
          operation: 'Create Task',
          showToast: false,
          logError: true
        });
        
        return await createTaskWithErrorHandling({
          task: taskWithMonthId,
          userData: user,
          reporters
        });
      }
    },
    {
      operation: mode === 'edit' ? 'update' : 'create',
      resource: 'task',
      onSuccess: (result) => {
        reset();
        onSuccess?.(result);
      }
    }
  );

  const onSubmit = async (data) => {
    await handleFormSubmit(data, { reset, setError, clearErrors });
  };

  const handleFormError = (errors) => {
    handleFormValidation(errors, 'Task Form');
  };

  const formTitle = mode === 'edit' ? 'Edit Task' : 'Create New Task';
  const submitButtonText = mode === 'edit' ? 'Update Task' : 'Create Task';

  // Helper function to create field props
  const createFieldProps = (field) => ({
    field,
    register,
    errors,
    getInputType,
    setValue,
    watch,
    trigger,
    clearErrors,
    formValues: watchedValues
  });

  // Helper function to render fields based on type
  const renderField = (field, fieldProps) => {
    if (field.name === 'deliverables') {
      return <DeliverablesField key={field.name} {...fieldProps} />;
    }
    if (field.type === 'select') {
      return <SelectField key={field.name} {...fieldProps} />;
    }
    if (field.type === 'multiSelect') {
      return <MultiSelectField key={field.name} {...fieldProps} />;
    }
    if (field.type === 'checkbox') {
      return <CheckboxField key={field.name} {...fieldProps} />;
    }
    if (field.type === 'number') {
      return <NumberField key={field.name} {...fieldProps} />;
    }
    if (field.type === 'date') {
      return <SimpleDateField key={field.name} {...fieldProps} />;
    }
    if (field.type === 'textarea') {
      return <TextareaField key={field.name} {...fieldProps} />;
    }
    // Default to TextField
    return <TextField key={field.name} {...fieldProps} />;
  };

  // Helper function to render fields by name
  const renderFieldsByName = (fieldNames) => {
    return fieldsWithOptions
      .filter(field => fieldNames.includes(field.name))
      .map((field) => {
        const fieldProps = createFieldProps(field);
        return renderField(field, fieldProps);
      });
  };

  // Get fields with dynamic options (reporters)
  const fieldsWithOptions = TASK_FORM_FIELDS.map(field => {
    if (field.name === 'reporters') {
      const reporterOptions = reporters?.map(reporter => ({
        value: reporter.id,
        label: `${reporter.name} (${reporter.email})`
      })) || [];
      
      return {
        ...field,
        options: reporterOptions
      };
    }
    return field;
  });

  return (
    <div className={`p-6 ${className}`}>
      
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-6">
        {/* 1. Jira Link - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['jiraLink'])}
        </div>

        {/* 2. Department + Product - 2 columns */}
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldsByName(['departments', 'products'])}
          </div>
        </div>

        {/* 3. Markets + Total Time Hours - 2 columns */}
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldsByName(['markets', 'timeInHours'])}
          </div>
        </div>
        
        {/* 4. Start Date + End Date - 2 columns */}
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldsByName(['startDate', 'endDate'])}
          </div>
        </div>

        {/* 5. Reporter - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['reporters'])}
        </div>

        {/* 6. Observations - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['observations'])}
        </div>

  
        {/* 7. AI Used - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['_usedAIEnabled'])}
        </div>

        {/* 7. AI Models + AI Time - 2 columns (conditional) */}
        {watchedValues._usedAIEnabled && (
          <div className="form-section">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFieldsByName(['aiModels', 'aiTime'])}
            </div>
          </div>
        )}

        {/* 8. Has Deliverables - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['_hasDeliverables'])}
        </div>

        {/* 9. Deliverables - Full Width (conditional) */}
        {watchedValues._hasDeliverables && (
          <div className="form-section">
            {renderFieldsByName(['deliverables'])}
          </div>
        )}

        {/* VIP Task Checkbox - Full Width */}
        <div className="form-section ">
          {renderFieldsByName(['isVip'])}
        </div>

        <div className="form-section  ">
          {renderFieldsByName(['reworked'])}
        </div>

        
        {/* Submit Button */}
        <div className="flex justify-end ">
          <DynamicButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            loading={isSubmitting}
            iconName={mode === 'create' ? 'add' : 'edit'}
            iconPosition="left"
            loadingText="Saving..."
            className="px-8 py-3"
          >
            {submitButtonText}
          </DynamicButton>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;

