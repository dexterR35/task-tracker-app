import React, { useCallback, useState, useRef, useEffect } from "react";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../../features/tasks/tasksApi";
import { useFetchData } from "../hooks/useFetchData";
import { logger } from "../utils/logger";
import {
  marketOptions,
  productOptions,
  taskNameOptions,
  aiModelOptions,
  deliverables,
} from "./TaskOptions";

import {
  DynamicForm,
} from "../forms";
import { TASK_FORM_FIELDS } from "../forms/configs";
import { showSuccess, showError } from "../utils/toast";
import { extractTaskNumber } from "../forms/validation/validationRules";



const TaskForm = ({
  initialValues: customInitialValues,
  error = null,
  mode = "create", // "create" or "edit"
  taskId = null, // For edit mode
  debug = true, // Enable debug mode to see validation errors
}) => {

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  
  // Local state for form submission control
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Reset submission state when mode or taskId changes
  useEffect(() => {
    setIsSubmitting(false);
  }, [mode, taskId]);

  const handleSubmit = async (preparedData, { setSubmitting, resetForm, setFieldError }) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      logger.warn('Task submission blocked - already submitting');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Handle deliverables logic
      let processedData = { ...preparedData };
      
      if (!preparedData.hasDeliverables) {
        // If no deliverables, set defaults for database
        processedData = {
          ...processedData,
          deliverables: [],
          deliverablesCount: 0,
          deliverablesOther: []
        };
      } else {
        // If has deliverables, ensure required fields are present
        if (!preparedData.deliverables || preparedData.deliverables.length === 0) {
          throw new Error('Please select at least one deliverable when deliverables are enabled');
        }
        if (!preparedData.deliverablesCount || preparedData.deliverablesCount < 1) {
          throw new Error('Please specify the number of deliverables');
        }
        // If "others" is selected, ensure deliverablesOther is provided
        if (preparedData.deliverables.includes('others') && 
            (!preparedData.deliverablesOther || preparedData.deliverablesOther.length === 0)) {
          throw new Error('Please specify other deliverables when "Others" is selected');
        }
      }
      
      // Handle AI tools logic
      if (!preparedData.aiUsed) {
        // If no AI used, set defaults for database
        processedData = {
          ...processedData,
          timeSpentOnAI: 0,
          aiModels: []
        };
      } else {
        // If AI is used, ensure required fields are present
        if (!preparedData.timeSpentOnAI || preparedData.timeSpentOnAI < 0.5) {
          throw new Error('Please specify time spent on AI (minimum 0.5 hours)');
        }
        if (!preparedData.aiModels || preparedData.aiModels.length === 0) {
          throw new Error('Please select at least one AI model when AI is used');
        }
      }
      
      // Remove UI-only fields from database data (they're only for form control)
      const { hasDeliverables, aiUsed, ...dataForDatabase } = processedData;
      
      // Extract task number from Jira link if present and add monthId
      const data = {
        ...dataForDatabase,
        monthId, // Add monthId from useFetchData
        taskNumber: dataForDatabase.jiraLink ? extractTaskNumber(dataForDatabase.jiraLink) : dataForDatabase.taskNumber,
      };
      
      logger.log(`${mode === 'edit' ? 'Updating' : 'Creating'} task with data:`, data);



      let result;
      if (mode === 'edit') {
        // For edit mode, we need to extract the task ID and format the data correctly
        const currentTaskId = taskId || customInitialValues?.id;
        if (!currentTaskId) {
          throw new Error('Task ID is required for editing');
        }
        
        // Remove the id from updates to avoid conflicts
        const { id, ...updates } = data;
        
        result = await updateTask({
          monthId,
          id: currentTaskId,
          updates
        }).unwrap();
        
        logger.log(`Task updated successfull111:`, result);
        showSuccess(`Task updated successfully!`);
      } else {
        result = await createTask(data).unwrap();
        logger.log(`Task created successfully222:`, result);
        showSuccess(`Task created successfully!`);
      }
      
      // Reset form only in create mode
      if (mode === 'create') {
        resetForm();
      }
      
    } catch (error) {
      logger.error(`Task ${mode === 'edit' ? 'update' : 'creation'} failed:`, error);
      
      // Show error message
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
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };



  // Simple form header
  const renderFormHeader = () => (
    <div className="form-header mb-6">
      <h2 className="text-xl font-semibold">
        {mode === 'edit' ? 'Edit Task' : 'Create New Task'}
      </h2>
      <p className="text-gray-300 mt-1">
        {mode === 'edit' 
          ? `Update the task details below  ${monthId}`
          : `Fill in the details below to create a new task for ${monthId}`
        }
      </p>
      {isSubmitting && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm flex items-center">
            <span className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin mr-2"></span>
            {mode === 'edit' ? 'Updating task...' : 'Creating task...'}
          </p>
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
        initialValues={{
          hasDeliverables: false,
          ...customInitialValues
        }}
        onSubmit={handleSubmit}

        error={error}
        className="space-y-6"
        debug={debug} // Enable debug mode to see validation errors

        submitText={mode === 'edit' ? 'Update Task' : 'Create Task'}
        submitButtonProps={{
          loading: isSubmitting,
          loadingText: mode === 'edit' ? "Updating..." : "Creating...",
          iconName: mode === 'edit' ? "edit" : "plus",
          iconPosition: "left",
          variant: mode === 'edit' ? "secondary" : "primary",
          disabled: isSubmitting
        }}
        // Add form-level validation
        validateOnMount={false}
        validateOnChange={true}
        validateOnBlur={true}
        // Prevent form submission during loading
        onFormReady={(formikProps) => {
          // Disable form submission via Enter key during loading
          if (isSubmitting) {
            formikProps.setSubmitting(true);
          }
        }}
      />
    </div>
  );
};

export default TaskForm;
