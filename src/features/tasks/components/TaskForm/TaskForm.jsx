import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAppData } from '@/hooks/useAppData';
import { showSuccess, showError, showAuthError } from '@/utils/toast';
import { handleValidationError, handleSuccess, withMutationErrorHandling } from '@/features/utils/errorHandling';
import { createFormSubmissionHandler, handleFormValidation, prepareFormData } from '@/utils/formUtils';
import { 
  createTaskFormSchema, 
  createTaskFormFields, 
  prepareTaskFormData,
  shouldShowField,
  isConditionallyRequired
} from '@/features/tasks/config/useTaskForm';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';
import { useDeliverablesByDepartment } from '@/hooks/useDeliverablesByDepartment';
import { 
  TextField, 
  TextareaField,
  SelectField, 
  MultiSelectField, 
  NumberField, 
  CheckboxField,
  SearchableDeliverablesField,
  SearchableSelectField,
  SimpleDateField,
  UrlField
} from '@/components/forms/components';
import DeliverablesField from '@/components/forms/components/DeliverablesField';
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
  monthId: propMonthId = null,
  onSuccess, 
  className = "" 
}) => {
  const { createTask, updateTask, reporters = [], monthId: hookMonthId, user, refetchCurrentMonth, refetchMonthTasks } = useAppData();
  
  // Use prop monthId if provided, otherwise fall back to hook monthId
  const monthId = propMonthId || hookMonthId;
  const { deliverablesOptions, isLoading: loadingDeliverables } = useDeliverablesOptions();
  
  // Debug logging for deliverables
  React.useEffect(() => {
    console.log('TaskForm - deliverablesOptions:', deliverablesOptions);
    console.log('TaskForm - loadingDeliverables:', loadingDeliverables);
  }, [deliverablesOptions, loadingDeliverables]);
  
  // Create dynamic form fields with deliverables options
  const formFields = React.useMemo(() => {
    return createTaskFormFields(deliverablesOptions);
  }, [deliverablesOptions]);

  // Create dynamic schema with deliverables options
  const dynamicSchema = React.useMemo(() => {
    return createTaskFormSchema();
  }, []);
  
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
    resolver: yupResolver(dynamicSchema),
    defaultValues: {
      jiraLink: '',
      products: '',
      departments: '',
      markets: [],
      timeInHours: '',
      startDate: '',
      endDate: '',
      _hasDeliverables: false,
      deliverables: '',
      customDeliverables: [],
      deliverableQuantities: {},
      declinariQuantities: {},
      declinariDeliverables: {},
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
  
  // Watch reporters field specifically for debugging
  const selectedReporter = watch('reporters');
  React.useEffect(() => {
    console.log('TaskForm - Selected reporter value:', selectedReporter);
    if (selectedReporter) {
      const matchingReporter = reporters.find(r => r.reporterUID === selectedReporter);
      console.log('TaskForm - Matching reporter found:', matchingReporter);
    }
  }, [selectedReporter, reporters]);
  
  // Explicitly register deliverableQuantities field
  React.useEffect(() => {
    register('deliverableQuantities');
    register('declinariQuantities');
    register('declinariDeliverables');
    
    // Initialize deliverableQuantities with empty object if not set
    const currentQuantities = watch('deliverableQuantities');
    console.log('TaskForm - current deliverableQuantities:', currentQuantities);
    if (!currentQuantities || Object.keys(currentQuantities).length === 0) {
      setValue('deliverableQuantities', {});
    }
  }, [register, setValue, watch]);

  // Watch the selected department to filter deliverables
  const selectedDepartment = watch('departments');
  const { deliverablesOptions: filteredDeliverablesOptions } = useDeliverablesByDepartment(selectedDepartment);

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

  // Clear deliverables selection when department changes
  useEffect(() => {
    if (selectedDepartment) {
      setValue('deliverables', '');
      clearErrors('deliverables');
    }
  }, [selectedDepartment, setValue, clearErrors]);

  useEffect(() => {
    if (!usedAIEnabled) {
      clearErrors('aiModels');
      clearErrors('aiTime');
    }
  }, [usedAIEnabled, clearErrors]);

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      console.log('TaskForm - Edit mode: initialData received:', initialData);
      // Handle nested data_task structure from database
      const taskData = initialData.data_task || initialData;
      console.log('TaskForm - Edit mode: processed taskData:', taskData);
      
      // Reconstruct jiraLink from taskName for editing - ensure taskName is uppercase
      const jiraLink = taskData.taskName ? 
        `https://gmrd.atlassian.net/browse/${taskData.taskName.toUpperCase()}` : 
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
      
      
      const formData = {
        jiraLink: jiraLink,
        products: taskData.products || '',
        departments: Array.isArray(taskData.departments) ? taskData.departments[0] || '' : taskData.departments || '',
        markets: taskData.markets || [],
        timeInHours: taskData.timeInHours || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        _hasDeliverables: !!(taskData.deliverablesUsed?.[0] || taskData.deliverables),
        deliverables: taskData.deliverablesUsed?.[0]?.name || 
          taskData.deliverables?.[0]?.deliverableName || '',
        deliverableQuantities: taskData.deliverablesUsed?.[0]?.name ? 
          { [taskData.deliverablesUsed[0].name]: taskData.deliverablesUsed[0].count } :
          taskData.deliverables?.[0]?.deliverableQuantities || {},
        declinariQuantities: taskData.deliverablesUsed?.[0]?.name ? 
          { [taskData.deliverablesUsed[0].name]: taskData.deliverablesUsed[0].declinariCount || 0 } :
          taskData.deliverables?.[0]?.declinariQuantities || {},
        declinariDeliverables: taskData.deliverablesUsed?.[0]?.name ? 
          { [taskData.deliverablesUsed[0].name]: taskData.deliverablesUsed[0].declinariEnabled || false } :
          taskData.deliverables?.[0]?.declinariDeliverables || {},
        customDeliverables: taskData.deliverablesUsed?.[0]?.customDeliverables || 
          taskData.customDeliverables || [],
        _usedAIEnabled: !!(taskData.aiUsed?.[0]?.aiModels?.length || taskData.aiModels?.length),
        aiModels: taskData.aiUsed?.[0]?.aiModels || taskData.aiModels || [],
        aiTime: taskData.aiUsed?.[0]?.aiTime || taskData.aiTime || 0,
        reporters: taskData.reporters || '',
        isVip: taskData.isVip || false,
        reworked: taskData.reworked || false,
        observations: taskData.observations || ''
      };
      
      console.log('TaskForm - Edit mode: form data being set:', formData);
      reset(formData);
      
      
    }
  }, [initialData, mode, reset]);

  // Create standardized form submission handler
  const handleFormSubmit = createFormSubmissionHandler(
    async (data) => {
      // Additional validation for conditional fields
      if (data._hasDeliverables && !data.deliverables) {
        throw new Error('Please select a deliverable when "Has Deliverables" is checked');
      }
      
      // Validate custom deliverables when "others" is selected
      if (data._hasDeliverables && data.deliverables === 'others') {
        if (!data.customDeliverables || data.customDeliverables.length === 0) {
          throw new Error('Please add at least one custom deliverable when "Others" is selected');
        }
      }
      

      if (data._hasDeliverables && data.deliverables && data.deliverables !== '') {
        const deliverable = deliverablesOptions.find(d => d.value === data.deliverables);
        console.log('Form submission - found deliverable:', deliverable);
        if (deliverable && deliverable.requiresQuantity) {
          const quantity = data.deliverableQuantities?.[data.deliverables];
          console.log('Form submission - quantity for', data.deliverables, ':', quantity);
          console.log('Form submission - quantity type:', typeof quantity);
          console.log('Form submission - quantity isNaN:', isNaN(quantity));
          console.log('Form submission - quantity < 1:', quantity < 1);
          
          if (!quantity || quantity < 1) {
            console.log('Form submission - quantity validation failed');
            throw new Error(`Please enter a valid quantity for ${deliverable.label}`);
          }
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
      console.log('TaskForm - Raw form data before processing:', data);
      const processedData = prepareTaskFormData(data, deliverablesOptions);
      console.log('TaskForm - Processed data after prepareTaskFormData:', processedData);
      
      if (mode === 'edit' && initialData?.id) {
        // Update existing task
        const updateTaskWithErrorHandling = withMutationErrorHandling(updateTask, {
          operation: 'Update Task',
          showToast: false,
          logError: true
        });
        
        return await updateTaskWithErrorHandling({
          monthId: initialData.monthId || initialData.data_task?.monthId || monthId,
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
      onSuccess: async (result) => {
        // Close modal immediately for better UX
        onSuccess?.(result);
        
        reset();
        
        // Trigger real-time updates in background
        try {
          await refetchCurrentMonth?.();
          await refetchMonthTasks?.();
        } catch (error) {
          // Silently handle refetch errors - they don't affect the main operation
        }
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
  const submitButtonText = mode === 'edit' ? 'Update Task' : 'Save Task';

  // Helper function to create field props
  const createFieldProps = (field) => ({
    field,
    register,
    errors,
    setValue,
    watch,
    trigger,
    clearErrors,
    formValues: watchedValues
  });

  // Helper function to render fields based on type
  const renderField = (field, fieldProps) => {
    if (field.name === 'deliverables') {
      return <SearchableDeliverablesField key={field.name} {...fieldProps} hideTimeInfo={true} />;
    }
    if (field.name === 'reporters') {
      return <SearchableSelectField key={field.name} {...fieldProps} />;
    }
    if (field.type === 'hidden') {
      // Hidden fields don't need to be rendered visually
      return null;
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
    if (field.type === 'url') {
      return <UrlField key={field.name} {...fieldProps} />;
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

  // Get fields with dynamic options (reporters and deliverables)
  const fieldsWithOptions = formFields.map(field => {
    if (field.name === 'reporters') {
      const reporterOptions = reporters?.map(reporter => ({
        value: reporter.reporterUID, // Use ONLY reporterUID since that's your primary field
        label: reporter.name, // Just the name for display
        name: reporter.name,
        email: reporter.email
      })) || [];
      
    
      return {
        ...field,
        options: reporterOptions
      };
    }
    if (field.name === 'deliverables') {
      // Use filtered deliverables based on selected department
      const deliverableOptions = filteredDeliverablesOptions?.map(deliverable => ({
        value: deliverable.value,
        label: deliverable.label,
        name: deliverable.label,
        department: deliverable.department,
        requiresQuantity: deliverable.requiresQuantity
      })) || [];
      
      return {
        ...field,
        options: deliverableOptions
      };
    }
    return field;
  });

  return (
    <div className={`p-6  w-full ${className}`}>
      
      <form onSubmit={handleSubmit(onSubmit, handleFormError)} className="space-y-3 ">
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

        {/* 3. Markets + Reporter - 2 columns */}
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldsByName(['markets', 'reporters'])}
          </div>
        </div>

        {/* 4. Start Date + End Date + Total Time Hours - 3 columns */}
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderFieldsByName(['startDate', 'endDate', 'timeInHours'])}
          </div>
        </div>

        {/* 7. VIP Task + Reworked - 2 columns */}
        <div className="form-section">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFieldsByName(['isVip', 'reworked'])}
          </div>
        </div>

        {/* 8. AI Used - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['_usedAIEnabled'])}
        </div>

        {/* 9. AI Models + AI Time - 2 columns (conditional) */}
        {watchedValues._usedAIEnabled && (
          <div className="form-section">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderFieldsByName(['aiModels', 'aiTime'])}
            </div>
          </div>
        )}

        {/* 10. Has Deliverables - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['_hasDeliverables'])}
        </div>

        {/* 11. Deliverables - Full Width (conditional) */}
        {watchedValues._hasDeliverables && (
          <div className="form-section">
            {renderFieldsByName(['deliverables'])}
          </div>
        )}

        {/* 11. Observations - Full Width */}
        <div className="form-section">
          {renderFieldsByName(['observations'])}
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

