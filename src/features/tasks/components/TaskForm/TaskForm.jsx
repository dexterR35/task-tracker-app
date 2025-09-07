import React, { useCallback } from "react";
import { Formik } from "formik";
import { useCreateTaskMutation, useUpdateTaskMutation } from "@/features/tasks";
import { useAuth } from "@/features/auth";
import { useMonthData } from "@/hooks";
import { taskFormSchema, getTaskFormInitialValues, TASK_FORM_OPTIONS, extractTaskNumber, TASK_FORM_CONFIG } from './taskFormSchema';
import { DynamicButton } from "@/components/ui";

// Import form components
import {
  JiraLinkField,
  TaskNumberField,
  MultiSelectField,
  SelectField,
  NumberField,
  CheckboxField,
  ReporterField
} from "./components/TaskFormFields";

// Import utilities
import { showInfo, showSuccess, showError } from "@/utils/toast";
import { handleApiError } from "@/features/utils/errorHandling";

const TaskForm = ({
  initialValues: customInitialValues,
  mode = "create", // "create" or "edit"
  taskId = null, // For edit mode
  onSuccess = null, // Callback for successful task creation/update (typically to close modal)
  reporters = [], // Reporters data passed from parent component
}) => {
  const { user } = useAuth();
  const { monthId } = useMonthData();
  
  
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  
  // Get initial values
  const initialValues = getTaskFormInitialValues(user, monthId, customInitialValues);
  
  // Form submission handler
  const handleSubmit = useCallback(async (values, { setSubmitting, resetForm }) => {
    try {
      const userUID = user?.userUID || user?.uid || user?.id;
      
      // Prepare task data
      const taskData = {
        jiraLink: values.jiraLink,
        taskNumber: values.taskNumber,
        markets: values.markets,
        products: values.products,
        departments: values.departments,
        timeInHours: values.timeInHours,
        deliverables: values.hasDeliverables ? values.deliverables : [],
        aiModels: values.usedAI ? (values.aiModels || []) : [],
        aiTime: values.usedAI ? (values.aiTime || 0) : 0,
        reporters: values.reporters,
        userUID,
        monthId
      };

      if (mode === 'create') {
        await createTask(taskData).unwrap();
        showSuccess('Task created successfully!');
      } else {
        // For edit mode, check if anything actually changed
        const originalData = customInitialValues;
        if (originalData) {
          // Compare current values with original values
          const hasChanges = (
            taskData.jiraLink !== originalData.jiraLink ||
            taskData.taskNumber !== originalData.taskNumber ||
            JSON.stringify(taskData.markets) !== JSON.stringify(originalData.markets) ||
            taskData.products !== originalData.products ||
            taskData.departments !== originalData.departments ||
            taskData.timeInHours !== originalData.timeInHours ||
            JSON.stringify(taskData.deliverables) !== JSON.stringify(originalData.deliverables) ||
            JSON.stringify(taskData.aiModels) !== JSON.stringify(originalData.aiModels) ||
            taskData.aiTime !== originalData.aiTime ||
            taskData.reporters !== originalData.reporters
          );

          if (!hasChanges) {
            showInfo('No changes detected. Task remains unchanged.');
            if (onSuccess) onSuccess();
            return;
          }
        }

        await updateTask({ monthId, id: taskId, updates: taskData }).unwrap();
        showSuccess('Task updated successfully!');
      }

      // Reset form for create mode
      if (mode === 'create') {
        resetForm();
      }
      
      // Call success callback (typically to close modal)
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      handleApiError(error, 'Task Submission', { showToast: true });
    } finally {
      setSubmitting(false);
    }
  }, [user, monthId, mode, taskId, createTask, updateTask, onSuccess]);

  // Inline handlers for better performance and simplicity
  const handleJiraLinkChange = useCallback((e, setFieldValue) => {
    const value = e.target.value;
    if (value) {
      const taskNumber = extractTaskNumber(value);
      if (taskNumber) {
        setFieldValue('taskNumber', taskNumber);
        showInfo(`Task number "${taskNumber}" auto-extracted from Jira link`);
      }
    }
  }, []);

  const handleUsedAIChange = useCallback((e, setFieldValue) => {
    const checked = e.target.checked;
    if (!checked) {
      setFieldValue('aiModels', []);
      setFieldValue('aiTime', 0);
    } else {
      setFieldValue('aiModels', []);
      setFieldValue('aiTime', TASK_FORM_CONFIG.DEFAULT_VALUES.AI_TIME_SPENT);
    }
  }, []);
  
  
  
  return (
    <div className="card bg-white-dark">
      
        <Formik
          initialValues={initialValues}
          validationSchema={taskFormSchema}
          enableReinitialize={true}
          validateOnChange={true}
          validateOnBlur={true}
          onSubmit={handleSubmit}
        >
          {(formik) => (
            <form onSubmit={formik.handleSubmit} className="space-y-8">
              
              {/* Task Information Section */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Task Information</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Jira Link - Full width */}
                  <div className="lg:col-span-2">
                    <JiraLinkField handleJiraLinkChange={handleJiraLinkChange} />
                  </div>
                  
                  {/* Task Number - Full width */}
                  <div className="lg:col-span-2">
                    <TaskNumberField />
                  </div>
                  
                  {/* Markets and Products - Side by side */}
                  <div>
                    <MultiSelectField
                      name="markets"
                      label="Markets"
                      options={TASK_FORM_OPTIONS.markets}
                      placeholder="Select a market"
                      required={true}
                      colorClass="bg-blue-100 text-blue-800"
                    />
                  </div>
                  <div>
                    <SelectField
                      name="products"
                      label="Products"
                      options={TASK_FORM_OPTIONS.products}
                      placeholder="Select a product"
                      required={true}
                    />
                  </div>
                  
                  {/* Task Name and Time - Side by side */}
                  <div>
                    <SelectField
                      name="departments"
                      label="Task Name"
                      options={TASK_FORM_OPTIONS.departments}
                      placeholder="Select task name"
                      required={true}
                    />
                  </div>
                  <div>
                    <NumberField
                      name="timeInHours"
                      label="Time in Hours"
                      step={TASK_FORM_CONFIG.TIME_INPUT.STEP_SIZE}
                      min={TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS}
                      max={TASK_FORM_CONFIG.TIME_INPUT.MAX_HOURS}
                      placeholder="2.5"
                      required={true}
                      helpText={`Total time spent (minimum ${TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS} hours)`}
                    />
                  </div>
                </div>
              </div>

              {/* Deliverables Section */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deliverables</h3>
                <div className="space-y-4">
                  <CheckboxField
                    name="hasDeliverables"
                    label="Has Deliverables"
                    helpText="Check if this task produces deliverables"
                  />
                  
                  {formik.values.hasDeliverables && (
                    <MultiSelectField
                      name="deliverables"
                      label="Deliverables"
                      options={TASK_FORM_OPTIONS.deliverables}
                      placeholder="Select a deliverable"
                      required={true}
                      colorClass="bg-purple-100 text-purple-800"
                    />
                  )}
                </div>
              </div>

              {/* AI Usage Section */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Usage</h3>
                <div className="space-y-4">
                  <CheckboxField
                    name="usedAI"
                    label="Used AI"
                    helpText="Check if AI tools were used in this task"
                    onChange={handleUsedAIChange}
                  />
                  
                  {formik.values.usedAI && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <NumberField
                        name="aiTime"
                        label="Time Spent on AI"
                        step={TASK_FORM_CONFIG.TIME_INPUT.STEP_SIZE}
                        min={TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS}
                        max={TASK_FORM_CONFIG.TIME_INPUT.MAX_HOURS}
                        placeholder="1.0"
                        required={true}
                        helpText={`AI time (minimum ${TASK_FORM_CONFIG.TIME_INPUT.MIN_HOURS} hours)`}
                      />
                      <MultiSelectField
                        name="aiModels"
                        label="AI Models"
                        options={TASK_FORM_OPTIONS.aiModels}
                        placeholder="Select an AI model"
                        required={true}
                        colorClass="bg-green-100 text-green-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Section */}
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Assignment</h3>
                <ReporterField reporters={reporters} />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <DynamicButton
                  type="submit"
                  disabled={formik.isSubmitting || !user || !formik.isValid}
                  loading={formik.isSubmitting}
                  variant="primary"
                  size="md"
                  loadingText="Saving..."
                >
                  {mode === 'edit' ? 'Update Task' : 'Create Task'}
                </DynamicButton>
              </div>
            </form>
          )}
        </Formik>
    </div>
  );
};

export default TaskForm;