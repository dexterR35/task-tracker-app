import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { Formik, Field } from "formik";
import { useCreateTaskMutation, useUpdateTaskMutation } from "@/features/tasks";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { selectCurrentMonthId } from "@/features/currentMonth";
import { useAuth } from "@/features/auth";
import { logger } from "@/utils/logger";
import { taskFormSchema, getTaskFormInitialValues, TASK_FORM_OPTIONS, extractTaskNumber } from './taskFormSchema';
import { sanitizeText, sanitizeUrl, sanitizeNumber, sanitizeBoolean, sanitizeArray } from "@/components/forms/utils/sanitization";
import { showSuccess, showError, showInfo } from "@/utils/toast";
import { DynamicButton } from "@/components/ui";

const TaskForm = ({
  initialValues: customInitialValues,
  mode = "create", // "create" or "edit"
  taskId = null, // For edit mode
  onSuccess = null, // Callback for successful task creation/update
}) => {
  const { user } = useAuth();
  const monthId = useSelector(selectCurrentMonthId);
  
  // Debug logging
  console.log('TaskForm user data:', {
    user,
    hasUser: !!user,
    userUID: user?.userUID,
    uid: user?.uid,
    id: user?.id,
    email: user?.email,
    name: user?.name
  });
  
  // Get reporters for the dropdown
  const { data: reporters = [] } = useGetReportersQuery();
  
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  
  // Get validation schema and initial values
  const validationSchema = taskFormSchema;
  const initialValues = getTaskFormInitialValues(user, monthId, customInitialValues);
  
  // Form submission handler
  const handleSubmit = async (values, { setSubmitting, resetForm, setValues, setTouched, setErrors }) => {
    try {
      // Validate user data is available
      if (!user || !user.userUID) {
        throw new Error('User data is not available. Please refresh the page and try again.');
      }
      
      // Validate reporters data is available
      if (!values.reporters || values.reporters.trim() === '') {
        throw new Error('Reporter is required. Please select a reporter.');
      }
      
      // Prepare data for database with sanitization and defaults
      const dataForDatabase = {
        // Sanitize and prepare form data
        jiraLink: sanitizeUrl(values.jiraLink),
        taskNumber: values.jiraLink ? extractTaskNumber(values.jiraLink) : sanitizeText(values.taskNumber),
        markets: sanitizeArray(values.markets),
        products: sanitizeText(values.products),
        departaments: sanitizeText(values.departaments),
        timeInHours: sanitizeNumber(values.timeInHours),
        reporters: values.reporters ? [{
          id: values.reporters,
          name: reporters.find(r => r.id === values.reporters)?.name || 'Unknown'
        }] : [],
        
        // AI fields - set defaults when AI is not used
        userAI: values.usedAI ? [{
          timeSpent: sanitizeNumber(values.userAI?.[0]?.timeSpent || 0),
          aiModels: sanitizeArray(values.userAI?.[0]?.aiModels || [])
        }] : [],
        
        // Deliverables fields - set defaults when deliverables are not used
        deliverables: values.hasDeliverables ? [{
          deliverables: sanitizeArray(values.deliverables || []),
          deliverablesCount: sanitizeArray(values.deliverables || []).length
        }] : [],
        
        // User and metadata
        createdBy: user ? [{
          id: user?.userUID || user?.uid || user?.id || '',
          name: user?.name || user?.displayName || user?.email || 'Unknown'
        }] : [],
        userUID: user?.userUID || user?.uid || user?.id || '',
        monthId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Validate final data before submission
      if (!dataForDatabase.userUID || dataForDatabase.userUID.trim() === '') {
        throw new Error('User ID is missing. Please refresh the page and try again.');
      }
      
      if (!dataForDatabase.createdBy || dataForDatabase.createdBy.length === 0) {
        throw new Error('Created by information is missing. Please refresh the page and try again.');
      }
      
      if (!dataForDatabase.reporters || dataForDatabase.reporters.length === 0) {
        throw new Error('Reporter information is missing. Please select a reporter.');
      }
      
      // Debug logging
      console.log('TaskForm Debug - Creating task with:', {
        userUID: user?.uid,
        userID: user?.id,
        userUserUID: user?.userUID,
        finalUserUID: user?.userUID || user?.uid || user?.id,
        userEmail: user?.email,
        monthId,
        dataForDatabase
      });
      
      if (mode === 'create') {
        // Create new task
        await createTask(dataForDatabase).unwrap();
        logger.log('Task created successfully', { taskData: dataForDatabase });
      } else {
        // Update existing task
        await updateTask({ id: taskId, data: dataForDatabase }).unwrap();
        showSuccess('Task updated successfully!');
        logger.log('Task updated successfully', { taskId, taskData: dataForDatabase });
      }
      
      // Reset form to default values for create mode
      if (mode === 'create') {
        const resetValues = {
          jiraLink: '',
          taskNumber: '',
          markets: [],
          products: '',
          departaments: '',
          timeInHours: 0,
          deliverables: [],
          userAI: [],
          reporters: user?.uid || user?.id || user?.userUID || ''
        };
        setValues(resetValues);
        setTouched({});
        setErrors({});
      } else {
        // For edit mode, just reset to initial values
        resetForm();
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      logger.error('Task submission failed', error);
      showError(error?.data?.message || 'Failed to save task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle Jira link change - auto-extract task number
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

  // Handle time in hours change - round to 0.5 increments
  const handleTimeInHoursChange = useCallback((e, setFieldValue) => {
    const value = parseFloat(e.target.value);
    if (value && value % 0.5 !== 0) {
      const rounded = Math.round(value * 2) / 2;
      setFieldValue('timeInHours', rounded);
    }
  }, []);

  // Handle AI usage change
  const handleUsedAIChange = useCallback((e, setFieldValue) => {
    const checked = e.target.checked;
    if (!checked) {
      setFieldValue('userAI', []);
    } else {
      setFieldValue('userAI', [{
        timeSpent: 0.5,
        aiModels: []
      }]);
    }
  }, []);
  
  const title = mode === 'edit' ? 'Edit Task' : 'Create New Task';
  const subtitle = mode === 'edit' 
    ? 'Update task information and save changes'
    : 'Fill in the details below to create a new task';
  
  return (
    <div className="card bg-white-dark">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
      </div>
      
      {/* User Data Warning */}
      {(!user || !user.userUID) && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <h3 className="font-semibold mb-2">⚠️ User Data Not Available</h3>
          <p>Your user information is not loaded. Please refresh the page and try again.</p>
        </div>
      )}
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize={true}
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            
            {/* Jira Link */}
            <div className="field-wrapper">
              <label htmlFor="jiraLink" className="block text-sm font-medium text-gray-700 mb-1">
                Jira Link <span className="text-red-500 ml-1">*</span>
              </label>
              <Field name="jiraLink">
                {({ field, meta }) => (
                  <>
                    <input
                      {...field}
                      type="url"
                      placeholder="https://jira.company.com/browse/TASK-123"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                      onChange={(e) => {
                        field.onChange(e);
                        handleJiraLinkChange(e, formik.setFieldValue);
                      }}
                    />
                    {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                  </>
                )}
              </Field>
              <p className="text-sm text-gray-500 mt-1">Enter the complete Jira ticket URL. Task number will be auto-extracted.</p>
            </div>

            {/* Task Number */}
            <div className="field-wrapper">
              <label htmlFor="taskNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Task Number <span className="text-red-500 ml-1">*</span>
              </label>
              <Field name="taskNumber">
                {({ field, meta }) => (
                  <>
                    <input
                      {...field}
                      type="text"
                      placeholder="TASK-123"
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border rounded-md bg-gray-100 border-gray-300"
                    />
                    {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                  </>
                )}
              </Field>
              <p className="text-sm text-gray-500 mt-1">Task number (auto-extracted from Jira link, cannot be manually edited)</p>
            </div>

            {/* Markets */}
            <div className="field-wrapper">
              <label htmlFor="markets" className="block text-sm font-medium text-gray-700 mb-1">
                Markets <span className="text-red-500 ml-1">*</span>
              </label>
              <Field name="markets">
                {({ field, meta }) => (
                  <>
                    <select
                      {...field}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                      onChange={(e) => {
                        const selectedValue = e.target.value;
                        if (selectedValue && !field.value.includes(selectedValue)) {
                          const newValues = [...field.value, selectedValue];
                          const syntheticEvent = {
                            target: { name: 'markets', value: newValues }
                          };
                          field.onChange(syntheticEvent);
                          e.target.value = ''; // Reset select
                        }
                      }}
                    >
                      <option value="">Select a market</option>
                      {TASK_FORM_OPTIONS.markets
                        .filter(option => !field.value.includes(option.value))
                        .map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                    </select>
                    
                    {/* Selected Markets Display */}
                    {field.value && field.value.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((market) => (
                            <span
                              key={market}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {TASK_FORM_OPTIONS.markets.find(opt => opt.value === market)?.label || market}
                              <button
                                type="button"
                                onClick={() => {
                                  const newValues = field.value.filter(m => m !== market);
                                  const syntheticEvent = {
                                    target: { name: 'markets', value: newValues }
                                  };
                                  field.onChange(syntheticEvent);
                                }}
                                className="ml-2 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                  </>
                )}
              </Field>
            </div>

            {/* Products */}
            <div className="field-wrapper">
              <label htmlFor="products" className="block text-sm font-medium text-gray-700 mb-1">
                Products <span className="text-red-500 ml-1">*</span>
              </label>
              <Field name="products">
                {({ field, meta }) => (
                  <>
                    <select
                      {...field}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                    >
                      <option value="">Select a product</option>
                      {TASK_FORM_OPTIONS.products.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                  </>
                )}
              </Field>
            </div>

            {/* Task Name */}
            <div className="field-wrapper">
              <label htmlFor="departaments" className="block text-sm font-medium text-gray-700 mb-1">
                Task Name <span className="text-red-500 ml-1">*</span>
              </label>
              <Field name="departaments">
                {({ field, meta }) => (
                  <>
                    <select
                      {...field}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                    >
                      <option value="">Select task name</option>
                      {TASK_FORM_OPTIONS.departaments.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                  </>
                )}
              </Field>
            </div>

            {/* Time in Hours */}
            <div className="field-wrapper">
              <label htmlFor="timeInHours" className="block text-sm font-medium text-gray-700 mb-1">
                Time in Hours <span className="text-red-500 ml-1">*</span>
              </label>
              <Field name="timeInHours">
                {({ field, meta }) => (
                  <>
                    <input
                      {...field}
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="24"
                      placeholder="2.5"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                      onChange={(e) => {
                        field.onChange(e);
                        handleTimeInHoursChange(e, formik.setFieldValue);
                      }}
                    />
                    {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                  </>
                )}
              </Field>
              <p className="text-sm text-gray-500 mt-1">Total time spent on this task (0.5 - 24 hours)</p>
            </div>

            {/* Has Deliverables */}
            <div className="field-wrapper">
              <Field name="hasDeliverables">
                {({ field, meta }) => (
                  <div className="flex items-start space-x-3">
                    <input
                      {...field}
                      type="checkbox"
                      checked={field.value}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <label htmlFor="hasDeliverables" className="text-sm font-medium text-gray-700">
                        Has Deliverables
                      </label>
                      <p className="text-sm text-gray-500">Check if this task produces deliverables</p>
                    </div>
                  </div>
                )}
              </Field>
            </div>

            {/* Deliverables - Conditional */}
            {formik.values.hasDeliverables && (
              <div className="field-wrapper">
                <label htmlFor="deliverables" className="block text-sm font-medium text-gray-700 mb-1">
                  Deliverables <span className="text-red-500 ml-1">*</span>
                </label>
                <Field name="deliverables">
                  {({ field, meta }) => (
                    <>
                      <select
                        {...field}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          if (selectedValue && !field.value.includes(selectedValue)) {
                            const newValues = [...field.value, selectedValue];
                            const syntheticEvent = {
                              target: { name: 'deliverables', value: newValues }
                            };
                            field.onChange(syntheticEvent);
                            e.target.value = ''; // Reset select
                          }
                        }}
                      >
                        <option value="">Select a deliverable</option>
                        {TASK_FORM_OPTIONS.deliverables
                          .filter(option => !field.value.includes(option.value))
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                      
                      {/* Selected Deliverables Display */}
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((deliverable) => (
                              <span
                                key={deliverable}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                              >
                                {TASK_FORM_OPTIONS.deliverables.find(opt => opt.value === deliverable)?.label || deliverable}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValues = field.value.filter(d => d !== deliverable);
                                    const syntheticEvent = {
                                      target: { name: 'deliverables', value: newValues }
                                    };
                                    field.onChange(syntheticEvent);
                                  }}
                                  className="ml-2 text-purple-600 hover:text-purple-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                    </>
                  )}
                </Field>
              </div>
            )}

            {/* Used AI */}
            <div className="field-wrapper">
              <Field name="usedAI">
                {({ field, meta }) => (
                  <div className="flex items-start space-x-3">
                    <input
                      {...field}
                      type="checkbox"
                      checked={field.value}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onChange={(e) => {
                        field.onChange(e);
                        handleUsedAIChange(e, formik.setFieldValue);
                      }}
                    />
                    <div>
                      <label htmlFor="usedAI" className="text-sm font-medium text-gray-700">
                        Used AI
                      </label>
                      <p className="text-sm text-gray-500">Check if AI tools were used in this task</p>
                    </div>
                  </div>
                )}
              </Field>
            </div>

            {/* Time Spent on AI - Conditional */}
            {formik.values.usedAI && (
              <div className="field-wrapper">
                <label htmlFor="userAI.0.timeSpent" className="block text-sm font-medium text-gray-700 mb-1">
                  Time Spent on AI <span className="text-red-500 ml-1">*</span>
                </label>
                <Field name="userAI.0.timeSpent">
                  {({ field, meta }) => (
                    <>
                      <input
                        {...field}
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="24"
                        placeholder="1.0"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                      />
                      {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                    </>
                  )}
                </Field>
                <p className="text-sm text-gray-500 mt-1">Time spent using AI tools (0.5 - 24 hours)</p>
              </div>
            )}

            {/* AI Models - Conditional */}
            {formik.values.usedAI && (
              <div className="field-wrapper">
                <label htmlFor="userAI.0.aiModels" className="block text-sm font-medium text-gray-700 mb-1">
                  AI Models <span className="text-red-500 ml-1">*</span>
                </label>
                <Field name="userAI.0.aiModels">
                  {({ field, meta }) => (
                    <>
                      <select
                        {...field}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                        onChange={(e) => {
                          const selectedValue = e.target.value;
                          if (selectedValue && !field.value.includes(selectedValue)) {
                            const newValues = [...field.value, selectedValue];
                            const syntheticEvent = {
                              target: { name: 'userAI.0.aiModels', value: newValues }
                            };
                            field.onChange(syntheticEvent);
                            e.target.value = ''; // Reset select
                          }
                        }}
                      >
                        <option value="">Select an AI model</option>
                        {TASK_FORM_OPTIONS.aiModels
                          .filter(option => !field.value.includes(option.value))
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                      
                      {/* Selected AI Models Display */}
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-2">
                            {field.value.map((model) => (
                              <span
                                key={model}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                              >
                                {TASK_FORM_OPTIONS.aiModels.find(opt => opt.value === model)?.label || model}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValues = field.value.filter(m => m !== model);
                                    const syntheticEvent = {
                                      target: { name: 'userAI.0.aiModels', value: newValues }
                                    };
                                    field.onChange(syntheticEvent);
                                  }}
                                  className="ml-2 text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                    </>
                  )}
                </Field>
              </div>
            )}

            {/* Reporters */}
            <div className="field-wrapper">
              <label htmlFor="reporters" className="block text-sm font-medium text-gray-700 mb-1">
                Reporter <span className="text-red-500 ml-1">*</span>
              </label>
              <Field name="reporters">
                {({ field, meta }) => (
                  <>
                    <select
                      {...field}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors border-gray-300"
                    >
                      <option value="">Select a reporter</option>
                      {reporters.map((reporter) => (
                        <option key={reporter.id} value={reporter.id}>
                          {reporter.name} ({reporter.email})
                        </option>
                      ))}
                    </select>
                    {meta.touched && meta.error && <div className="text-red-500 text-sm mt-1">{meta.error}</div>}
                  </>
                )}
              </Field>
              <p className="text-sm text-gray-500 mt-1">Select the person responsible for this task (defaults to current user)</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <DynamicButton
                onClick={formik.handleSubmit}
                disabled={formik.isSubmitting || !user || !user.userUID}
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