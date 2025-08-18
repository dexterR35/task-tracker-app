import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DynamicButton from "../DynamicButton";
import { useAuth } from "../../hooks/useAuth";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { beginLoading, endLoading } from "../../redux/slices/loadingSlice";
import { createTask, updateTask } from "../../redux/slices/tasksSlice";
import { useNotifications } from "../../hooks/useNotifications";
import {
  marketOptions,
  productOptions,
  taskNameOptions,
  aiModelOptions,
} from "../../constants/taskOptions";

// Clean TaskForm component (UI slice removed)
const TaskForm = ({
  onSubmit: customOnSubmit,
  initialValues: customInitialValues,
  isEdit = false,
}) => {
  const { user } = useAuth();
  const [outerSubmitting, setOuterSubmitting] = useState(false);
  const { addError } = useNotifications();
  const monthId = dayjs().format("YYYY-MM");
  const dispatch = useDispatch();

  const defaultInitialValues = {
    jiraLink: "",
    market: "",
    product: "",
    taskName: "",
    aiUsed: false,
    timeSpentOnAI: "",
    aiModel: "",
    timeInHours: "",
    reworked: false,
  };

  const initialValues = customInitialValues || defaultInitialValues;

  const validationSchema = Yup.object({
    jiraLink: Yup.string()
      .url("Must be a valid URL")
      .required("Jira link is required"),
    market: Yup.string().required("Market selection is required"),
    product: Yup.string().required("Product selection is required"),
    taskName: Yup.string().required("Task name is required"),
    aiUsed: Yup.boolean(),
    timeSpentOnAI: Yup.number().when("aiUsed", {
      is: true,
      then: (schema) =>
        schema
          .required("Time spent on AI is required when AI is used")
          .min(0, "Time must be positive"),
      otherwise: (schema) => schema.notRequired(),
    }),
    aiModel: Yup.string().when("aiUsed", {
      is: true,
      then: (schema) => schema.required("AI model is required when AI is used"),
      otherwise: (schema) => schema.notRequired(),
    }),
    timeInHours: Yup.number()
      .required("Task completion time is required")
      .min(0.1, "Time must be at least 0.1 hours"),
    reworked: Yup.boolean(),
  });

  const creatingRef = useRef(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setOuterSubmitting(true);
      dispatch(beginLoading());
      const taskData = {
        ...values,
        timeSpentOnAI: (() => {
          if (!values.aiUsed) return 0;
          const n = parseFloat(values.timeSpentOnAI);
          return isNaN(n) ? 0 : n;
        })(),
        timeInHours: (() => {
          const n = parseFloat(values.timeInHours);
          return isNaN(n) ? 0 : n;
        })(),
        createdBy: user?.uid,
        createdByName: user?.name || user?.email,
        userUID: user?.uid,
        monthId,
      };

      console.log("[TaskForm] submit", {
        isEdit,
        id: initialValues.id,
        monthId,
        taskData,
      });
      if (customOnSubmit) {
        await customOnSubmit(taskData);
      } else if (isEdit && initialValues.id) {
        if (creatingRef.current) return;
        creatingRef.current = true;
     await dispatch(updateTask({ monthId, id: initialValues.id, data: taskData }));

      } else {
        if (creatingRef.current) return;
        creatingRef.current = true;
        await dispatch(createTask(taskData));
      }

      if (!isEdit) resetForm();
    } catch (error) {
      if (
        error?.code === "month-not-generated" ||
        error?.message === "MONTH_NOT_GENERATED"
      ) {
        addError("Please tell the admin to generate the current month first.");
      } else {
        console.error("Error submitting task:", error);
        addError("Failed to submit task");
      }
    } finally {
      creatingRef.current = false;
      setSubmitting(false);
      setOuterSubmitting(false);
      dispatch(endLoading());
    }
  };

  const renderField = (field) => {
    const { meta } = field;
    const hasError = meta.touched && meta.error;
    const baseInputClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      hasError ? "border-red-500" : "border-gray-300"
    }`;
    return { baseInputClasses, hasError };
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        {isEdit ? "Edit Task" : "Create New Task"}
      </h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values }) => (
          <Form className="space-y-6">
            <Field name="jiraLink">
              {(field) => {
                const { baseInputClasses } = renderField(field);
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
                    <ErrorMessage
                      name="jiraLink"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>
            <Field name="market">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Market *
                    </label>
                    <select {...field.field} className={baseInputClasses}>
                      <option value="">Select a market</option>
                      {marketOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage
                      name="market"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>
            <Field name="product">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product *
                    </label>
                    <select {...field.field} className={baseInputClasses}>
                      <option value="">Select a product</option>
                      {productOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage
                      name="product"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>
            <Field name="taskName">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Name *
                    </label>
                    <select {...field.field} className={baseInputClasses}>
                      <option value="">Select task type</option>
                      {taskNameOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <ErrorMessage
                      name="taskName"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>
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
                    <span className="text-sm font-medium text-gray-700">
                      AI Used
                    </span>
                  </label>
                </div>
              )}
            </Field>
            {values.aiUsed && (
              <>
                <Field name="timeSpentOnAI">
                  {(field) => {
                    const { baseInputClasses } = renderField(field);
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
                        <ErrorMessage
                          name="timeSpentOnAI"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>
                    );
                  }}
                </Field>
                <Field name="aiModel">
                  {(field) => {
                    const { baseInputClasses } = renderField(field);
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          AI Model *
                        </label>
                        <select {...field.field} className={baseInputClasses}>
                          <option value="">Select AI model</option>
                          {aiModelOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <ErrorMessage
                          name="aiModel"
                          component="div"
                          className="text-red-500 text-sm mt-1"
                        />
                      </div>
                    );
                  }}
                </Field>
              </>
            )}
            <Field name="timeInHours">
              {(field) => {
                const { baseInputClasses } = renderField(field);
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
                    <ErrorMessage
                      name="timeInHours"
                      component="div"
                      className="text-red-500 text-sm mt-1"
                    />
                  </div>
                );
              }}
            </Field>
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
                    <span className="text-sm font-medium text-gray-700">
                      Component Reworked
                    </span>
                  </label>
                </div>
              )}
            </Field>
            <div className="flex justify-end space-x-3 pt-6">
              <DynamicButton
                id="task-form-submit"
                type="submit"
                variant="primary"
                size="lg"
                loading={isSubmitting || outerSubmitting}
                loadingText={isEdit ? "Updating..." : "Creating..."}
                successMessage={
                  isEdit
                    ? "Task updated successfully!"
                    : "Task created successfully!"
                }
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
