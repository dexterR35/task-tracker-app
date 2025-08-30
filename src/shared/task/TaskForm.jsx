import React, { useState, useCallback, useMemo } from "react";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../../features/tasks/tasksApi";
import { useFetchData } from "../hooks/useFetchData";
import { logger } from "../utils/logger";
import {
  marketOptions,
  productOptions,
  taskNameOptions,
  aiModelOptions,
  deliverables,
} from "../utils/taskOptions";

import {
  DynamicForm,
  TASK_FORM_FIELDS,
} from "../forms";
import { showSuccess, showError, showInfo, showWarning } from "../utils/toast";
import { handleConditionalFieldDefaults } from "../forms/sanitization/preparators";


const TaskForm = ({
  onSubmit: customOnSubmit,
  initialValues: customInitialValues,
  loading = false,
  error = null,
  mode = "create", // "create" or "edit"
  taskId = null, // For edit mode
  onFormChange = null, // Callback for form changes
  skipInternalUpdate = false, // Skip internal update handling for external control
  debug = true, // Enable debug mode to see validation errors
}) => {
  const [outerSubmitting, setOuterSubmitting] = useState(false);
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  // Get data from centralized hook (including user)
  const { user, reporters = [], monthId } = useFetchData();
  
  // Get field configuration and add options
  const getFieldConfig = useCallback(() => {
    const fields = [...TASK_FORM_FIELDS];
    
    // Add options for select fields
    const options = {
      markets: marketOptions,
      product: productOptions,
      taskName: taskNameOptions,
      aiModels: aiModelOptions,
      deliverables: deliverables,
      reporters: reporters.map(reporter => ({
        value: reporter.id,
        label: `${reporter.name} (${reporter.email})`
      }))
    };

    return { fields, options };
  }, [reporters]);

  const { fields, options } = getFieldConfig();









  const handleSubmit = async (preparedData, { setSubmitting, resetForm, setFieldError }) => {
    try {
      setOuterSubmitting(true);
      
      logger.log(`${mode === 'edit' ? 'Updating' : 'Creating'} task with data:`, preparedData);



      let result;
      if (mode === 'edit') {
        // For edit mode, we need to extract the task ID and format the data correctly
        const currentTaskId = taskId || customInitialValues?.id;
        if (!currentTaskId) {
          throw new Error('Task ID is required for editing');
        }
        
        if (skipInternalUpdate) {
          // Skip internal update handling - let parent component handle it
          result = preparedData;
          logger.log(`Task data prepared for external update:`, result);
        } else {
          // Remove the id from updates to avoid conflicts
          const { id, ...updates } = preparedData;
          
          result = await updateTask({
            monthId,
            id: currentTaskId,
            updates
          }).unwrap();
          
          logger.log(`Task updated successfully:`, result);
          showSuccess(`Task updated successfully!`);
        }
      } else {
        result = await createTask(preparedData).unwrap();
        logger.log(`Task created successfully:`, result);
        showSuccess(`Task created successfully!`);
      }
      
      // Reset form only in create mode
      if (mode === 'create') {
        resetForm();
      }
      
      // Call custom onSubmit if provided
      if (customOnSubmit) {
        customOnSubmit(result);
      }
      
    } catch (error) {
      logger.error(`Task ${mode === 'edit' ? 'update' : 'creation'} failed:`, error);
      
      // Handle specific error types with better messages
      if (error?.message?.includes("permission")) {
        showError("Permission denied. Please check your access rights.");
      } else if (error?.message?.includes("network")) {
        showError("Network error. Please check your connection and try again.");
      } else if (error?.message?.includes("Month board not generated")) {
        showError("Month board not generated. Please contact an admin to create the board first.");
      } else if (error?.message?.includes("already exists")) {
        showError("A task with this information already exists. Please check your data.");
      } else if (error?.message?.includes("validation")) {
        showError("Please check your form data and try again.");
      } else {
        showError(error?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} task. Please try again.`);
      }
      
      // Call custom error handler if provided
      if (customOnSubmit && typeof customOnSubmit === 'function') {
        customOnSubmit(null, error);
      }
    } finally {
      setSubmitting(false);
      setOuterSubmitting(false);
    }
  };

  // Enhanced initial values with better defaults
  const getEnhancedInitialValues = useCallback(() => {
    // Find current user as reporter
    const currentUserReporter = reporters.find(reporter => 
      reporter.userUID === user?.uid || reporter.id === user?.uid
    );
    
    const baseValues = {
      ...customInitialValues,
      // Set default values for better UX
      aiUsed: customInitialValues?.aiUsed || false,
      reworked: customInitialValues?.reworked || false,
      timeInHours: customInitialValues?.timeInHours || 1,
      deliverablesCount: customInitialValues?.deliverablesCount || 1,
      // Auto-set reporter to current user if not specified
      reporters: customInitialValues?.reporters || (currentUserReporter?.id || ''),
    };

    return baseValues;
  }, [customInitialValues, user, reporters]);

  // Simple form header
  const renderFormHeader = () => (
    <div className="form-header mb-6">
      <h2 className="text-xl font-semibold">
        {mode === 'edit' ? 'Edit Task' : 'Create New Task'}
      </h2>
      <p className="text-gray-600 mt-1">
        {mode === 'edit' 
          ? `Update the task details below`
          : `Fill in the details below to create a new task for ${monthId}`
        }
      </p>
    </div>
  );

  return (
    <div className="card">
      {renderFormHeader()}
      
      <DynamicForm
        fields={fields}
        options={options}
        initialValues={getEnhancedInitialValues()}
        onSubmit={handleSubmit}
        loading={loading || outerSubmitting}
        error={error}
        className="space-y-6"
        formType="task"
        context={{ user, monthId, reporters, mode, taskId }}
        debug={debug} // Enable debug mode to see validation errors

        submitText={mode === 'edit' ? 'Update Task' : 'Create Task'}
        submitButtonProps={{
          loadingText: mode === 'edit' ? "Updating..." : "Creating...",
          iconName: mode === 'edit' ? "edit" : "plus",
          iconPosition: "left",
          variant: mode === 'edit' ? "secondary" : "primary",
          disabled: false // Progress validation handled by DynamicForm
        }}
        // Enhanced validation feedback
        showSubmitButton={true}
        // Add form-level validation
        validateOnMount={false}
        validateOnChange={true}
        validateOnBlur={true}
      />
    </div>
  );
};

export default TaskForm;
