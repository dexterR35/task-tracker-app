import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAppData } from '@/hooks/useAppData';
import { showSuccess, showError } from '@/utils/toast';
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
      aiTime: '',
      reporters: ''
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange'
  });

  // Watch all form values for conditional field logic
  const watchedValues = watch();

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      reset({
        jiraLink: initialData.jiraLink || '',
        products: initialData.products || '',
        departments: initialData.departments || '',
        markets: initialData.markets || [],
        timeInHours: initialData.timeInHours || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        _hasDeliverables: initialData._hasDeliverables || false,
        deliverables: initialData.deliverables || [],
        _usedAIEnabled: initialData._usedAIEnabled || false,
        aiModels: initialData.aiModels || [],
        aiTime: initialData.aiTime || '',
        reporters: initialData.reporters || ''
      });
      logger.log('🔄 Task form reset with initial data:', initialData);
    }
  }, [initialData, mode, reset]);

  const onSubmit = async (data) => {
    try {
      logger.log('📋 Task form submission started:', { mode, data });
      
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
          reporters
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
        logger.log('👤 User data being passed:', user);
        
        result = await createTask({
          task: taskWithMonthId,
          userData: user,
          reporters
        });
        
        // Check if the result contains an error
        if (result?.error) {
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
      showError(error.message || 'Failed to save task. Please try again.');
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

