import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useGlobalMonthId } from "../../../shared/hooks/useGlobalMonthId";
import { useCreateTaskMutation } from "../tasksApi";
import { useCentralizedDataAnalytics } from "../../../shared/hooks/analytics/useCentralizedDataAnalytics";
import { logger } from "../../../shared/utils/logger";
import {
  marketOptions,
  productOptions,
  taskNameOptions,
  aiModelOptions,
  deliverables,
} from "../../../shared/utils/taskOptions";

import {
  DynamicForm,
  TASK_FORM_FIELDS,
} from "../../../shared/forms";
import { showSuccess, showError, showInfo, showWarning } from "../../../shared/utils/toast";
import { extractTaskNumber } from "../../../shared/forms/sanitization";

const TaskForm = ({
  onSubmit: customOnSubmit,
  initialValues: customInitialValues,
  loading = false,
  error = null,
  mode = "create", // "create" or "edit"
  taskId = null, // For edit mode
  onFormChange = null, // Callback for form changes
  autoSave = false, // Enable auto-save functionality
}) => {
  const { user } = useAuth();
  const [outerSubmitting, setOuterSubmitting] = useState(false);
  const [formData, setFormData] = useState(null);
  const [formProgress, setFormProgress] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const { monthId } = useGlobalMonthId();
  const [createTask] = useCreateTaskMutation();

  // Only call analytics hook if authenticated and have valid monthId
  const shouldCallAnalytics = user && monthId && typeof monthId === 'string' && monthId.match(/^\d{4}-\d{2}$/);
  const { reporters = [] } = useCentralizedDataAnalytics(
    shouldCallAnalytics ? monthId : null
  );

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

  // Calculate form progress
  const calculateFormProgress = useCallback((values) => {
    const requiredFields = fields.filter(field => field.required);
    const filledRequiredFields = requiredFields.filter(field => {
      const value = values[field.name];
      if (field.type === 'checkbox') return value !== undefined;
      if (field.type === 'multiSelect' || field.type === 'multiValue') {
        return Array.isArray(value) && value.length > 0;
      }
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((filledRequiredFields.length / requiredFields.length) * 100);
  }, [fields]);

  // Auto-extract task number from Jira link
  const handleJiraLinkChange = useCallback((formikHelpers, jiraLink) => {
    if (jiraLink) {
      const taskNumber = extractTaskNumber(jiraLink);
      if (taskNumber) {
        formikHelpers.setFieldValue('taskNumber', taskNumber);
        showInfo(`Task number "${taskNumber}" auto-extracted from Jira link`);
      }
    }
  }, []);

  // Enhanced field change handler
  const handleFieldChange = useCallback((fieldName, value, formikHelpers) => {
    // Auto-extract task number when Jira link changes
    if (fieldName === 'jiraLink') {
      handleJiraLinkChange(formikHelpers, value);
    }

    // Auto-calculate deliverables count when deliverables change
    if (fieldName === 'deliverables') {
      const deliverablesCount = Array.isArray(value) ? value.length : 0;
      formikHelpers.setFieldValue('deliverablesCount', deliverablesCount);
    }

    // Auto-calculate AI time when AI models change
    if (fieldName === 'aiModels') {
      const aiModelsCount = Array.isArray(value) ? value.length : 0;
      if (aiModelsCount > 0 && !formikHelpers.values.timeSpentOnAI) {
        // Suggest default AI time based on number of models
        const suggestedTime = Math.max(0.5, aiModelsCount * 0.5);
        formikHelpers.setFieldValue('timeSpentOnAI', suggestedTime);
      }
    }

    // Update form progress
    const progress = calculateFormProgress(formikHelpers.values);
    setFormProgress(progress);

    // Store form data for potential auto-save
    const newFormData = {
      ...formikHelpers.values,
      [fieldName]: value
    };
    setFormData(newFormData);

    // Call onFormChange callback if provided
    if (onFormChange) {
      onFormChange(newFormData, progress);
    }

    // Auto-save functionality
    if (autoSave && progress > 50) {
      // Debounced auto-save
      setTimeout(() => {
        setLastSaved(new Date());
        logger.log('Auto-saved form data:', newFormData);
      }, 2000);
    }
  }, [handleJiraLinkChange, calculateFormProgress, onFormChange, autoSave]);

  // Form validation feedback
  const getFormValidationFeedback = useMemo(() => {
    if (formProgress === 100) {
      return { type: 'success', message: 'All required fields completed!' };
    } else if (formProgress >= 75) {
      return { type: 'info', message: 'Almost done! Just a few more fields to go.' };
    } else if (formProgress >= 50) {
      return { type: 'warning', message: 'Halfway there! Keep going.' };
    } else if (formProgress >= 25) {
      return { type: 'info', message: 'Good start! Fill in more required fields.' };
    } else {
      return { type: 'warning', message: 'Please fill in the required fields to continue.' };
    }
  }, [formProgress]);

  const handleSubmit = async (preparedData, { setSubmitting, resetForm, setFieldError }) => {
    try {
      setOuterSubmitting(true);
      
      logger.log(`${mode === 'edit' ? 'Updating' : 'Creating'} task with data:`, preparedData);

      // Validate form progress before submission
      if (formProgress < 100) {
        showWarning('Please complete all required fields before submitting.');
        return;
      }

      // Create the task - data is already prepared
      const result = await createTask(preparedData).unwrap();
      
      logger.log(`Task ${mode === 'edit' ? 'updated' : 'created'} successfully:`, result);
      
      // Show success message
      showSuccess(`Task ${mode === 'edit' ? 'updated' : 'created'} successfully!`);
      
      // Reset form only in create mode
      if (mode === 'create') {
        resetForm();
        setFormData(null);
        setFormProgress(0);
        setLastSaved(null);
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
    const baseValues = {
      ...customInitialValues,
      // Set default values for better UX
      aiUsed: customInitialValues?.aiUsed || false,
      reworked: customInitialValues?.reworked || false,
      timeInHours: customInitialValues?.timeInHours || 1,
      deliverablesCount: customInitialValues?.deliverablesCount || 1,
      // Auto-set reporter to current user if not specified
      reporters: customInitialValues?.reporters || (user?.uid || ''),
    };

    return baseValues;
  }, [customInitialValues, user]);

  // Form header with progress indicator
  const renderFormHeader = () => (
    <div className="form-header mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
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
        
        {/* Progress indicator */}
        <div className="text-right">
          <div className="text-sm text-gray-600 mb-1">
            Progress: {formProgress}%
          </div>
          <div className="w-24 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                formProgress === 100 ? 'bg-green-500' :
                formProgress >= 75 ? 'bg-blue-500' :
                formProgress >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${formProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Validation feedback */}
      {formProgress > 0 && (
        <div className={`p-3 rounded-md text-sm ${
          getFormValidationFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          getFormValidationFeedback.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {getFormValidationFeedback.message}
        </div>
      )}
      
      {/* Auto-save indicator */}
      {autoSave && lastSaved && (
        <div className="text-xs text-gray-500 mt-2">
          Last auto-saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
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
        onFieldChange={handleFieldChange}
        submitText={mode === 'edit' ? 'Update Task' : 'Create Task'}
        submitButtonProps={{
          loadingText: mode === 'edit' ? "Updating..." : "Creating...",
          iconName: mode === 'edit' ? "edit" : "plus",
          iconPosition: "left",
          variant: mode === 'edit' ? "secondary" : "primary",
          disabled: formProgress < 100 // Disable submit until form is complete
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
