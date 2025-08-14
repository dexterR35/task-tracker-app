import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import DynamicButton from './DynamicButton';
import { useMonthlyTasks } from '../hooks/useFirestore';
import { useAuth } from '../hooks/useAuth';
import dayjs from 'dayjs';

const TaskForm = ({ onSubmit: customOnSubmit, initialValues: customInitialValues, isEdit = false }) => {
  const { user } = useAuth();
  const monthId = dayjs().format('YYYY-MM');
  const { addDocument, updateDocument } = useMonthlyTasks(monthId);

  // Market options
  const marketOptions = [
    { value: 'north-america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia-pacific', label: 'Asia Pacific' },
    { value: 'latin-america', label: 'Latin America' },
    { value: 'middle-east', label: 'Middle East' },
    { value: 'africa', label: 'Africa' },
    { value: 'global', label: 'Global' },
    { value: 'australia', label: 'Australia' },
    { value: 'canada', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' }
  ];

  // Product options
  const productOptions = [
    { value: 'web-app', label: 'Web Application' },
    { value: 'mobile-app', label: 'Mobile Application' },
    { value: 'desktop-app', label: 'Desktop Application' },
    { value: 'api', label: 'API/Backend' },
    { value: 'database', label: 'Database' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'analytics', label: 'Analytics Platform' },
    { value: 'ecommerce', label: 'E-commerce Platform' },
    { value: 'cms', label: 'Content Management System' },
    { value: 'crm', label: 'Customer Relationship Management' }
  ];

  // Task name options
  const taskNameOptions = [
    { value: 'video', label: 'Video Production' },
    { value: 'design', label: 'Design' },
    { value: 'dev', label: 'Development' }
  ];

  // AI model options
  const aiModelOptions = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5', label: 'GPT-3.5' },
    { value: 'claude-3', label: 'Claude 3' },
    { value: 'claude-2', label: 'Claude 2' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'llama-2', label: 'Llama 2' },
    { value: 'codex', label: 'Codex' },
    { value: 'copilot', label: 'GitHub Copilot' },
    { value: 'midjourney', label: 'Midjourney' },
    { value: 'stable-diffusion', label: 'Stable Diffusion' }
  ];

  const defaultInitialValues = {
    jiraLink: '',
    market: '',
    product: '',
    taskName: '',
    aiUsed: false,
    timeSpentOnAI: '',
    aiModel: '',
    timeInHours: '',
    reworked: false
  };

  const initialValues = customInitialValues || defaultInitialValues;

  const validationSchema = Yup.object({
    jiraLink: Yup.string()
      .url('Must be a valid URL')
      .required('Jira link is required'),
    market: Yup.string()
      .required('Market selection is required'),
    product: Yup.string()
      .required('Product selection is required'),
    taskName: Yup.string()
      .required('Task name is required'),
    aiUsed: Yup.boolean(),
    timeSpentOnAI: Yup.number()
      .when('aiUsed', {
        is: true,
        then: (schema) => schema.required('Time spent on AI is required when AI is used').min(0, 'Time must be positive'),
        otherwise: (schema) => schema.notRequired()
      }),
    aiModel: Yup.string()
      .when('aiUsed', {
        is: true,
        then: (schema) => schema.required('AI model is required when AI is used'),
        otherwise: (schema) => schema.notRequired()
      }),
    timeInHours: Yup.number()
      .required('Task completion time is required')
      .min(0.1, 'Time must be at least 0.1 hours'),
    reworked: Yup.boolean()
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const taskData = {
        ...values,
        timeSpentOnAI: (() => {
          if (!values.aiUsed) return 0;
          const n = parseFloat(values.timeSpentOnAI);
            return isNaN(n) ? 0 : n;
        })(),
        timeInHours: (() => { const n = parseFloat(values.timeInHours); return isNaN(n) ? 0 : n; })(),
        createdBy: user?.uid,
        createdByName: user?.name || user?.email,
        userUID: user?.uid,
        monthId
      };

      if (customOnSubmit) {
        await customOnSubmit(taskData);
      } else if (isEdit && initialValues.id) {
        await updateDocument(initialValues.id, taskData);
      } else {
        await addDocument(taskData);
      }

      if (!isEdit) {
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const { name, meta } = field;
    const hasError = meta.touched && meta.error;
    const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

    return { baseInputClasses, hasError };
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {isEdit ? 'Edit Task' : 'Create New Task'}
      </h2>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            {/* Jira Link */}
            <Field name="jiraLink">
              {(field) => {
                const { baseInputClasses, hasError } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jira Link *
                    </label>
                    <input
                      {...field.field}
                      type="url"
                      placeholder="https://your-domain.atlassian.net/browse/TASK-123"
                      className={baseInputClasses}
                    />
                    <ErrorMessage name="jiraLink" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                );
              }}
            </Field>

            {/* Market Selection */}
            <Field name="market">
              {(field) => {
                const { baseInputClasses, hasError } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Market *
                    </label>
                    <select {...field.field} className={baseInputClasses}>
                      <option value="">Select a market</option>
                      {marketOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage name="market" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                );
              }}
            </Field>

            {/* Product Selection */}
            <Field name="product">
              {(field) => {
                const { baseInputClasses, hasError } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <select {...field.field} className={baseInputClasses}>
                      <option value="">Select a product</option>
                      {productOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage name="product" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                );
              }}
            </Field>

            {/* Task Name */}
            <Field name="taskName">
              {(field) => {
                const { baseInputClasses, hasError } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Name *
                    </label>
                    <select {...field.field} className={baseInputClasses}>
                      <option value="">Select task type</option>
                      {taskNameOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage name="taskName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                );
              }}
            </Field>

            {/* AI Used Checkbox */}
            <Field name="aiUsed">
              {(field) => (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      {...field.field}
                      type="checkbox"
                      checked={field.field.value}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">AI Used</span>
                  </label>
                </div>
              )}
            </Field>

            {/* Conditional AI Fields */}
            {values.aiUsed && (
              <>
                {/* Time Spent on AI */}
                <Field name="timeSpentOnAI">
                  {(field) => {
                    const { baseInputClasses, hasError } = renderField(field);
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Spent on AI (hours) *
                        </label>
                        <input
                          {...field.field}
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="e.g., 2.5"
                          className={baseInputClasses}
                        />
                        <ErrorMessage name="timeSpentOnAI" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    );
                  }}
                </Field>

                {/* AI Model */}
                <Field name="aiModel">
                  {(field) => {
                    const { baseInputClasses, hasError } = renderField(field);
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          AI Model *
                        </label>
                        <select {...field.field} className={baseInputClasses}>
                          <option value="">Select AI model</option>
                          {aiModelOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ErrorMessage name="aiModel" component="div" className="text-red-500 text-sm mt-1" />
                      </div>
                    );
                  }}
                </Field>
              </>
            )}

            {/* Time in Hours */}
            <Field name="timeInHours">
              {(field) => {
                const { baseInputClasses, hasError } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Completion Time (hours) *
                    </label>
                    <input
                      {...field.field}
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g., 8.0"
                      className={baseInputClasses}
                    />
                    <ErrorMessage name="timeInHours" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                );
              }}
            </Field>

            {/* Reworked Checkbox */}
            <Field name="reworked">
              {(field) => (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      {...field.field}
                      type="checkbox"
                      checked={field.field.value}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Component Reworked</span>
                  </label>
                </div>
              )}
            </Field>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6">
              <DynamicButton
                id="task-form-submit"
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting}
                loadingText={isEdit ? "Updating..." : "Creating..."}
                successMessage={isEdit ? "Task updated successfully!" : "Task created successfully!"}
              >
                {isEdit ? "Update Task" : "Create Task"}
              </DynamicButton>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default TaskForm;
