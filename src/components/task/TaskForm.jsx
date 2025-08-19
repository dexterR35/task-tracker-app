import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DynamicButton from "../DynamicButton";
import { useAuth } from "../../hooks/useAuth";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../../redux/services/tasksApi";
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
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const defaultInitialValues = {
    jiraLink: "",
    markets: [],
    product: "",
    taskName: "",
    aiUsed: false,
    timeSpentOnAI: "",
    aiModels: [],
    timeInHours: "",
    reworked: false,
    deliverables: [],
  };

  const initialValues = customInitialValues || defaultInitialValues;

  const validationSchema = Yup.object({
    jiraLink: Yup.string()
      .url("Must be a valid URL")
      .required("Jira link is required"),
    markets: Yup.array().of(Yup.string()).min(1, "Select at least one market"),
    product: Yup.string().required("Product selection is required"),
    taskName: Yup.string().required("Task name is required"),
    aiUsed: Yup.boolean(),
    timeSpentOnAI: Yup.number().when("aiUsed", {
      is: true,
      then: (schema) =>
        schema
          .required("Time spent on AI is required when AI is used")
          .min(0.5, "Minimum is 0.5h"),
      otherwise: (schema) => schema.notRequired(),
    }),
    aiModels: Yup.array().of(Yup.string()).when("aiUsed", {
      is: true,
      then: (schema) => schema.min(1, "Select at least one AI model"),
      otherwise: (schema) => schema.optional(),
    }),
    timeInHours: Yup.number()
      .required("Task completion time is required")
      .min(0.5, "Minimum is 0.5h"),
    reworked: Yup.boolean(),
    deliverables: Yup.array().of(Yup.string()).min(1, "Select at least one deliverable"),
  });

  const creatingRef = useRef(false);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setOuterSubmitting(true);
      const quantize = (n) => {
        if (typeof n !== 'number' || Number.isNaN(n)) return 0;
        return Math.round(n * 2) / 2;
      };

      const taskData = {
        ...values,
        timeSpentOnAI: (() => {
          if (!values.aiUsed) return 0;
          const n = parseFloat(values.timeSpentOnAI);
          return isNaN(n) ? 0 : quantize(n);
        })(),
        timeInHours: (() => {
          const n = parseFloat(values.timeInHours);
          return isNaN(n) ? 0 : quantize(n);
        })(),
        aiModels: Array.isArray(values.aiModels) ? values.aiModels : (values.aiModels ? [values.aiModels] : []),
        markets: Array.isArray(values.markets) ? values.markets : (values.markets ? [values.markets] : []),
        deliverables: Array.isArray(values.deliverables) ? values.deliverables : (values.deliverables ? [values.deliverables] : []),
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
        await updateTask({ monthId, id: initialValues.id, updates: taskData }).unwrap();
      } else {
        if (creatingRef.current) return;
        creatingRef.current = true;
        await createTask(taskData).unwrap();
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
            <Field name="markets">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                const selected = field.form.values.markets || [];
                const addMarket = (val) => {
                  if (!val) return;
                  if (selected.includes(val)) return;
                  field.form.setFieldValue('markets', [...selected, val]);
                };
                const removeMarket = (val) => {
                  field.form.setFieldValue('markets', selected.filter((m) => m !== val));
                };
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Markets *</label>
                    <select className={baseInputClasses} value="" onChange={(e) => addMarket(e.target.value)}>
                      <option value="">Add a market…</option>
                      {marketOptions.filter(o => !selected.includes(o.value)).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.map((m) => (
                        <span key={m} className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs">
                          {m}
                          <button type="button" onClick={() => removeMarket(m)} className="ml-1 text-blue-600">×</button>
                        </span>
                      ))}
                    </div>
                    <ErrorMessage name="markets" component="div" className="text-red-500 text-sm mt-1" />
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
                <Field name="aiModels">
                  {(field) => {
                    const { baseInputClasses } = renderField(field);
                    const selected = field.form.values.aiModels || [];
                    const addModel = (val) => {
                      if (!val) return;
                      if (selected.includes(val)) return;
                      field.form.setFieldValue('aiModels', [...selected, val]);
                    };
                    const removeModel = (val) => {
                      field.form.setFieldValue('aiModels', selected.filter((m) => m !== val));
                    };
                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          AI Model(s) *
                        </label>
                        <select className={baseInputClasses} value="" onChange={(e) => addModel(e.target.value)}>
                          <option value="">Add a model…</option>
                          {aiModelOptions.filter(o => !selected.includes(o.value)).map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selected.map((m) => (
                            <span key={m} className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                              {m}
                              <button type="button" onClick={() => removeModel(m)} className="ml-1 text-green-600">×</button>
                            </span>
                          ))}
                        </div>
                        <ErrorMessage
                          name="aiModels"
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
                      step="0.5"
                      min="0.5"
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
            <Field name="deliverables">
              {(field) => {
                const { baseInputClasses } = renderField(field);
                const selected = field.form.values.deliverables || [];
                const addDeliv = (val) => {
                  if (!val) return;
                  if (selected.includes(val)) return;
                  field.form.setFieldValue('deliverables', [...selected, val]);
                };
                const removeDeliv = (val) => {
                  field.form.setFieldValue('deliverables', selected.filter((d) => d !== val));
                };
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deliverables *</label>
                    <select className={baseInputClasses} value="" onChange={(e) => addDeliv(e.target.value)}>
                      <option value="">Add</option>
                      {[1,2,3,4,5,6,7,8,9,10].filter(n => !selected.includes(String(n))).map(n => (
                        <option key={n} value={String(n)}>{n}</option>
                      ))}
                    </select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selected.map((d) => (
                        <span key={d} className="inline-flex items-center px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs">
                          {d}
                          <button type="button" onClick={() => removeDeliv(d)} className="ml-1 text-purple-600">×</button>
                        </span>
                      ))}
                    </div>
                    <ErrorMessage name="deliverables" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                );
              }}
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
