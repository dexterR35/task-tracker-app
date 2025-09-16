import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAppData } from '@/hooks/useAppData';
import { showSuccess, showError, showAuthError } from '@/utils/toast';
import { 
  taskFormSchema, 
  TASK_FORM_FIELDS, 
  prepareTaskFormData
} from './configs/useTaskForm';
import { shouldShowField } from './configs/sharedFormUtils';
import { 
  TextField, 
  SelectField, 
  MultiSelectField, 
  NumberField, 
  CheckboxField,
  SimpleDateField 
} from './components';
import { getInputType } from './configs/sharedFormUtils';
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
    clearErrors
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
      _usedAIEnabled: false,
      aiModels: [],
      aiTime: 0,
      reporters: ''
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  // Watch all form values for conditional field logic
  const watchedValues = watch();

  // Watch checkbox values to clear errors when unchecked
  const hasDeliverables = watch('_hasDeliverables');
  const usedAIEnabled = watch('_usedAIEnabled');

  // Clear validation errors when checkboxes are unchecked
  useEffect(() => {
    if (!hasDeliverables) {
      clearErrors('deliverables');
    }
  }, [hasDeliverables, clearErrors]);

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

  const onSubmit = async (data) => {
    try {
      logger.log('📋 Task form submission started:', { mode, data });
      
      // Permission validation now happens at API level
      
      // Additional validation for conditional fields
      if (data._hasDeliverables && (!data.deliverables || data.deliverables.length === 0)) {
        showError('Please select at least one deliverable when "Has Deliverables" is checked');
        return;
      }
      
      if (data._usedAIEnabled) {
        if (!data.aiModels || data.aiModels.length === 0) {
          showError('Please select at least one AI model when "AI Tools Used" is checked');
          return;
        }
        if (!data.aiTime || data.aiTime <= 0) {
          showError('Please enter a valid AI time when "AI Tools Used" is checked');
          return;
        }
      }
      
      // Prepare form data for database
      const processedData = prepareTaskFormData(data);
      logger.log('💾 Processed task data:', processedData);
      
      let result;
      
      if (mode === 'edit' && initialData?.id) {
        // Update existing task
        result = await updateTask({
          monthId: initialData.monthId,
          taskId: initialData.id,
          updates: processedData,
          reporters,
          userData: user  // Pass user data for permission validation
        });
        
        logger.log('✅ Task updated successfully:', result);
        showSuccess('Task updated successfully!');
        
      } else {
        // Create new task - include monthId in task data
        const taskWithMonthId = {
          ...processedData,
          monthId: monthId
        };
        
        logger.log('📅 Creating task with monthId:', monthId);
        logger.log('📋 Task data with monthId:', taskWithMonthId);
        // User data passed for validation
        
        result = await createTask({
          task: taskWithMonthId,
          userData: user,
          reporters
        });
        
        // Check if the result contains an error
        if (result?.error) {
          logger.error('❌ Task creation failed:', result.error);
          throw new Error(result.error.message || 'Failed to create task');
        }
        
        logger.log('✅ Task created successfully:', result);
        showSuccess('Task created successfully!');
      }
      
      // Reset form
      reset();
      
      // Call success callback if provided
      onSuccess?.(result);
      
    } catch (error) {
      logger.error('❌ Task form submission failed:', error);
      
      // Handle permission errors specifically
      if (error?.message?.includes('permission') || error?.message?.includes('User lacks required')) {
        const action = mode === 'create' ? 'create' : 'update';
        showAuthError(`You do not have permission to ${action} tasks`);
      } else {
        showError(error.message || 'Failed to save task. Please try again.');
      }
    }
  };

  const handleFormError = (errors) => {
    logger.error('❌ Task form validation errors:', errors);
    showError('Please fix the validation errors before submitting');
  };

  const formTitle = mode === 'edit' ? 'Edit Task' : 'Create New Task';
  const submitButtonText = mode === 'edit' ? 'Update Task' : 'Create Task';

  // Helper function to render fields based on type
  const renderField = (field, fieldProps) => {
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
    // Default to TextField
    return <TextField key={field.name} {...fieldProps} />;
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
    <div className={`bg-gray-700 p-2 px-8 ${className}`}>
   
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className=" space-y-0 ">
        {/* 1. Jira Link - Full Width */}
        {fieldsWithOptions
          .filter(field => field.name === 'jiraLink')
          .map((field) => {
            const fieldProps = {
              field,
              register,
              errors,
              getInputType,
              setValue,
              watch,
              trigger,
              clearErrors,
              formValues: watchedValues
            };
            return renderField(field, fieldProps);
          })}

        {/* 2. Department + Product - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fieldsWithOptions
            .filter(field => field.name === 'departments')
            .map((field) => {
              const fieldProps = {
                field,
                register,
                errors,
                getInputType,
                setValue,
                watch,
                trigger,
                clearErrors,
                formValues: watchedValues
              };
              return renderField(field, fieldProps);
            })}
          
          {fieldsWithOptions
            .filter(field => field.name === 'products')
            .map((field) => {
              const fieldProps = {
                field,
                register,
                errors,
                getInputType,
                setValue,
                watch,
                trigger,
                clearErrors,
                formValues: watchedValues
              };
              return renderField(field, fieldProps);
            })}
        </div>

        {/* 3. Markets + Total Time Hours - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fieldsWithOptions
            .filter(field => field.name === 'markets')
            .map((field) => {
              const fieldProps = {
                field,
                register,
                errors,
                getInputType,
                setValue,
                watch,
                trigger,
                clearErrors,
                formValues: watchedValues
              };
              return renderField(field, fieldProps);
            })}
          
          {fieldsWithOptions
            .filter(field => field.name === 'timeInHours')
            .map((field) => {
              const fieldProps = {
                field,
                register,
                errors,
                getInputType,
                setValue,
                watch,
                trigger,
                clearErrors,
                formValues: watchedValues
              };
              return renderField(field, fieldProps);
            })}
        </div>
        {/* 4. Start Date + End Date - 2 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fieldsWithOptions
            .filter(field => field.name === 'startDate')
            .map((field) => {
              const fieldProps = {
                field,
                register,
                errors,
                getInputType,
                setValue,
                watch,
                trigger,
                clearErrors,
                formValues: watchedValues
              };
              return renderField(field, fieldProps);
            })}
          
          {fieldsWithOptions
            .filter(field => field.name === 'endDate')
            .map((field) => {
              const fieldProps = {
                field,
                register,
                errors,
                getInputType,
                setValue,
                watch,
                trigger,
                clearErrors,
                formValues: watchedValues
              };
              return renderField(field, fieldProps);
            })}
        </div>

        {/* 5. Reporter - Full Width */}
        {fieldsWithOptions
          .filter(field => field.name === 'reporters')
          .map((field) => {
            const fieldProps = {
              field,
              register,
              errors,
              getInputType,
              setValue,
              watch,
              trigger,
              clearErrors,
              formValues: watchedValues
            };
            return renderField(field, fieldProps);
          })}

  
        {/* 6. AI Used - Full Width */}
        {fieldsWithOptions
          .filter(field => field.name === '_usedAIEnabled')
          .map((field) => {
            const fieldProps = {
              field,
              register,
              errors,
              getInputType,
              setValue,
              watch,
              trigger,
              clearErrors,
              formValues: watchedValues
            };
            return renderField(field, fieldProps);
          })}

        {/* 7. AI Models + AI Time - 2 columns (conditional) */}
        {watchedValues._usedAIEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fieldsWithOptions
              .filter(field => field.name === 'aiModels')
              .map((field) => {
                const fieldProps = {
                  field,
                  register,
                  errors,
                  getInputType,
                  setValue,
                  watch,
                  trigger,
                  clearErrors,
                  formValues: watchedValues
                };
                return renderField(field, fieldProps);
              })}
            
            {fieldsWithOptions
              .filter(field => field.name === 'aiTime')
              .map((field) => {
                const fieldProps = {
                  field,
                  register,
                  errors,
                  getInputType,
                  setValue,
                  watch,
                  trigger,
                  clearErrors,
                  formValues: watchedValues
                };
                return renderField(field, fieldProps);
              })}
          </div>
        )}

        {/* 8. Has Deliverables - Full Width */}
        {fieldsWithOptions
          .filter(field => field.name === '_hasDeliverables')
          .map((field) => {
            const fieldProps = {
              field,
              register,
              errors,
              getInputType,
              setValue,
              watch,
              trigger,
              clearErrors,
              formValues: watchedValues
            };
            return renderField(field, fieldProps);
          })}

        {/* 9. Deliverables - Full Width (conditional) */}
        {watchedValues._hasDeliverables && (
          fieldsWithOptions
            .filter(field => field.name === 'deliverables')
            .map((field) => {
              const fieldProps = {
                field,
                register,
                errors,
                getInputType,
                setValue,
                watch,
                trigger,
                clearErrors,
                formValues: watchedValues
              };
              return renderField(field, fieldProps);
            })
        )}

        
        {/* Submit Button */}
        <div className="form-actions">
          <DynamicButton
            type="submit"
            variant="primary"
            size="lg"
            disabled={isSubmitting}
            loading={isSubmitting}
            iconName={mode === 'create' ? 'add' : 'edit'}
            iconPosition="left"
            loadingText="Saving..."
            className="submit-button"
          >
            {submitButtonText}
          </DynamicButton>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;

