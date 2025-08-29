import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import DynamicButton from "../../../shared/components/ui/DynamicButton";
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

import MultiValueInput from "../../../shared/components/ui/MultiValueInput";
import {
  sanitizeTaskCreationData,
  validateTaskCreationData,
  validateJiraLink,
  extractTaskNumber,
} from "../../../shared/utils/sanitization";

// Clean TaskForm component (UI slice removed)
const TaskForm = ({
  onSubmit: customOnSubmit,
  initialValues: customInitialValues,
  loading = false,
  error = null,
}) => {
  const { user } = useAuth();
  const [outerSubmitting, setOuterSubmitting] = useState(false);
  const { monthId } = useGlobalMonthId();
  const [createTask] = useCreateTaskMutation();

  
  // Only call analytics hook if authenticated and have valid monthId
  const shouldCallAnalytics = user && monthId && typeof monthId === 'string' && monthId.match(/^\d{4}-\d{2}$/);
  const { reporters = [] } = useCentralizedDataAnalytics(
    shouldCallAnalytics ? monthId : null
  );

  const defaultInitialValues = {
    jiraLink: "",
    markets: [],
    product: "",
    taskName: "",
    aiUsed: false,
    timeSpentOnAI: "",
    aiModels: false,
    timeInHours: "",
    reworked: false,
    deliverables: [],
    deliverablesCount: "",
    deliverablesOther: false,
    taskNumber: "",
    reporters: "",
  };

  const initialValues = customInitialValues || defaultInitialValues;

  const validationSchema = Yup.object({
    jiraLink: Yup.string()
      .test("jira-format", "Invalid Jira link format", function (value) {
        if (!value) return false;
        const validation = validateJiraLink(value);
        return validation.isValid;
      })
      .required("Jira link is required"),
    markets: Yup.array()
      .of(Yup.string().required())
      .min(1, "Select at least one market")
      .required("Markets are required"),
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
    aiModels: Yup.mixed().when("aiUsed", {
      is: true,
      then: (schema) =>
        schema.test(
          "is-array-with-items",
          "Select at least one AI model",
          (value) => Array.isArray(value) && value.length > 0
        ),
      otherwise: (schema) => schema.optional(),
    }),
    timeInHours: Yup.number()
      .required("Task completion time is required")
      .min(0.5, "Minimum is 0.5h"),
    reworked: Yup.boolean(),
    deliverables: Yup.array()
      .of(Yup.string().required())
      .min(1, "Select at least one deliverable")
      .required("Deliverables are required"),
    deliverablesCount: Yup.number()
      .min(1, "Must be at least 1")
      .required("Number of deliverables is required")
      .transform((value) => (isNaN(value) ? undefined : value)),
    deliverablesOther: Yup.mixed().when("deliverables", {
      is: (deliverables) => deliverables && deliverables.includes("others"),
      then: (schema) =>
        schema.test(
          "is-array-with-items",
          "Please specify at least one other deliverable",
          (value) => Array.isArray(value) && value.length > 0
        ),
      otherwise: (schema) => schema.optional(),
    }),
    reporters: Yup.string()
      .required("Reporter selection is required"),
  });

  const creatingRef = useRef(false);

  // Helper function to quantize numbers to nearest 0.5
  const quantize = (n) => {
    if (typeof n !== "number" || Number.isNaN(n)) return 0;
    return Math.round(n * 2) / 2;
  };

  // Validate AI-related fields when AI is used
  const validateAIFields = (sanitizedValues) => {
    if (!sanitizedValues.aiUsed) return null;

    if (
      !Array.isArray(sanitizedValues.aiModels) ||
      sanitizedValues.aiModels.length === 0
    ) {
      return "Please specify at least one AI model when AI is used";
    }

    if (!sanitizedValues.timeSpentOnAI || sanitizedValues.timeSpentOnAI < 0.5) {
      return "Please specify time spent on AI (minimum 0.5h) when AI is used";
    }

    return null;
  };

  // Validate "others" deliverables when "others" is selected
  const validateOtherDeliverables = (sanitizedValues) => {
    if (!sanitizedValues.deliverables?.includes("others")) return null;

    if (
      !Array.isArray(sanitizedValues.deliverablesOther) ||
      sanitizedValues.deliverablesOther.length === 0
    ) {
      return "Please specify at least one other deliverable when 'others' is selected";
    }

    return null;
  };

  // Prepare task data for submission
  const prepareTaskData = (sanitizedValues, taskNumber) => {
    // Find the selected reporter to get their name (supports both document ID and reporterUID)
    const selectedReporter = reporters.find(reporter => 
      reporter.id === sanitizedValues.reporters || reporter.reporterUID === sanitizedValues.reporters
    );
    
    return {
      ...sanitizedValues,
      taskNumber,
      timeSpentOnAI: (() => {
        if (!sanitizedValues.aiUsed) return 0;
        const n = parseFloat(sanitizedValues.timeSpentOnAI);
        return isNaN(n) ? 0 : quantize(n);
      })(),
      timeInHours: (() => {
        const n = parseFloat(sanitizedValues.timeInHours);
        return isNaN(n) ? 0 : quantize(n);
      })(),
      // Always use arrays - empty array if not selected
      aiModels: Array.isArray(sanitizedValues.aiModels) && sanitizedValues.aiModels.length > 0
        ? sanitizedValues.aiModels
        : [],
      markets: Array.isArray(sanitizedValues.markets)
        ? sanitizedValues.markets
        : [],
      deliverables: Array.isArray(sanitizedValues.deliverables)
        ? sanitizedValues.deliverables
        : [],
      // Always use arrays - empty array if not selected
      deliverablesOther: Array.isArray(sanitizedValues.deliverablesOther) && sanitizedValues.deliverablesOther.length > 0
        ? sanitizedValues.deliverablesOther
        : [],
      deliverablesCount: Number(sanitizedValues.deliverablesCount) || 0,
      reporters: sanitizedValues.reporters || "",
      reporterName: selectedReporter?.name || "",
      reporterEmail: selectedReporter?.email || "",
      createdBy: user?.uid,
      createdByName: user?.name || user?.email,
      userUID: user?.uid,
      monthId: monthId, // Explicitly pass the global monthId
    };
  };

  // Handle custom submission or create task via API
  const submitTask = async (taskData) => {
    const { showSuccess } = await import("../../../shared/utils/toast");
    if (customOnSubmit) {
      await customOnSubmit(taskData);
      showSuccess("Task created successfully!");
    } else {
      if (creatingRef.current) return;
      creatingRef.current = true;
      const created = await createTask(taskData).unwrap();
      logger.log("[TaskForm] created", {
        id: created?.id,
        monthId: created?.monthId,
      });
      
      // Clear analytics cache to ensure reporter data is updated

      
      showSuccess(
        "Task created successfully! The task list will update automatically."
      );
    }
  };

  // Handle submission errors
  const handleSubmissionError = async (error) => {
    const { showError } = await import("../../../shared/utils/toast");
    if (
      error?.code === "month-not-generated" ||
      error?.message === "MONTH_NOT_GENERATED"
    ) {
      showError("Please tell the admin to generate the current month first.");
    } else {
      logger.error("Error submitting task:", error);
              showError("Failed to submit task. Please try again.");
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setOuterSubmitting(true);

      // Extract task number from Jira link
      const taskNumber = extractTaskNumber(values.jiraLink);

      // Sanitize the data
      const sanitizedValues = sanitizeTaskCreationData({
        ...values,
        taskNumber,
      });

      // Validate sanitized data
      const validationErrors = validateTaskCreationData(sanitizedValues);
      if (validationErrors.length > 0) {
        const { showError } = await import("../../../shared/utils/toast");
        showError(validationErrors[0]);
        return;
      }

      // Validate AI fields
      const aiValidationError = validateAIFields(sanitizedValues);
      if (aiValidationError) {
        const { showError } = await import("../../../shared/utils/toast");
        showError(aiValidationError);
        return;
      }

      // Validate other deliverables
      const deliverablesValidationError =
        validateOtherDeliverables(sanitizedValues);
      if (deliverablesValidationError) {
        const { showError } = await import("../../../shared/utils/toast");
        showError(deliverablesValidationError);
        return;
      }

      // Prepare task data
      const taskData = prepareTaskData(sanitizedValues, taskNumber);

      logger.log("[TaskForm] submit", {
        monthId,
        taskData,
      });

      // Submit task
      await submitTask(taskData);
      resetForm();
    } catch (error) {
      handleSubmissionError(error);
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
      hasError ? "border-red-error" : "border-gray-300"
    }`;
    return { baseInputClasses, hasError };
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-primary rounded-lg shadow-lg">
      <h2 className="mb-2">Create New Task</h2>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ isSubmitting, values, isValid, errors, touched }) => {
          // Custom validation logic to handle conditional fields
          const isFormValid = () => {
            // Basic required fields
            if (
              !values.jiraLink ||
              !values.markets?.length ||
              !values.product ||
              !values.taskName ||
              !values.timeInHours ||
              !values.deliverables?.length ||
              !values.deliverablesCount ||
              !values.reporters
            ) {
              return false;
            }

            // AI validation only if AI is used
            if (values.aiUsed) {
              if (
                !values.aiModels?.length ||
                !values.timeSpentOnAI ||
                values.timeSpentOnAI < 0.5
              ) {
                return false;
              }
            }

            // Other deliverables validation only if "others" is selected
            if (values.deliverables?.includes("others")) {
              if (!values.deliverablesOther?.length) {
                return false;
              }
            }

            return true;
          };

          return (
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
                        placeholder="https://gmrd.atlassian.net/browse/GIMODEAR-12345"
                        className={baseInputClasses}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Format: https://gmrd.atlassian.net/browse/GIMODEAR-
                        {"{taskNumber}"}
                      </p>
                      <ErrorMessage
                        name="jiraLink"
                        component="div"
                        className="text-red-error text-sm mt-1"
                      />
                    </div>
                  );
                }}
              </Field>
              <Field name="markets">
                {(field) => {
                  const { baseInputClasses } = renderField(field);
                  const selected = field.field.value || [];
                  const addMarket = (val) => {
                    if (!val) return;
                    if (selected.includes(val)) return;
                    field.form.setFieldValue("markets", [...selected, val]);
                  };
                  const removeMarket = (val) => {
                    field.form.setFieldValue(
                      "markets",
                      selected.filter((m) => m !== val)
                    );
                  };
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Markets *
                      </label>
                      <select
                        className={baseInputClasses}
                        value=""
                        onChange={(e) => addMarket(e.target.value)}
                      >
                        <option value="">Add a market…</option>
                        {marketOptions
                          .filter((o) => !selected.includes(o.value))
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selected.map((m) => (
                          <span key={m} className="rounded-grid-small">
                            {m}
                            <button
                              type="button"
                              onClick={() => removeMarket(m)}
                              className="ml-2 text-gray-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <ErrorMessage
                        name="markets"
                        component="div"
                        className="text-red-error text-sm mt-1"
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
                        className="text-red-error text-sm mt-1"
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
                        className="text-red-error text-sm mt-1"
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
                        onChange={(e) => {
                          field.form.setFieldValue("aiUsed", e.target.checked);
                          if (!e.target.checked) {
                            // Clear AI fields when AI is unchecked
                            field.form.setFieldValue("aiModels", false);
                            field.form.setFieldValue("timeSpentOnAI", "");
                          }
                        }}
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
                            Time Spent on AI (hours) {values.aiUsed ? "*" : ""}
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
                            className="text-red-error text-sm mt-1"
                          />
                        </div>
                      );
                    }}
                  </Field>
                  <Field name="aiModels">
                    {(field) => {
                      const { baseInputClasses } = renderField(field);
                      const selected = field.field.value || [];
                      const addModel = (val) => {
                        if (!val) return;
                        if (selected.includes(val)) return;
                        field.form.setFieldValue("aiModels", [
                          ...selected,
                          val,
                        ]);
                      };
                      const removeModel = (val) => {
                        field.form.setFieldValue(
                          "aiModels",
                          selected.filter((m) => m !== val)
                        );
                      };
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            AI Model(s) {values.aiUsed ? "*" : ""}
                          </label>
                          <select
                            className={baseInputClasses}
                            value=""
                            onChange={(e) => addModel(e.target.value)}
                          >
                            <option value="">Add a model…</option>
                            {aiModelOptions
                              .filter((o) => !selected.includes(o.value))
                              .map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                          </select>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selected.map((m) => (
                              <span key={m} className="rounded-grid-small">
                                {m}
                                <button
                                  type="button"
                                  onClick={() => removeModel(m)}
                                  className="ml-2 text-gray-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <ErrorMessage
                            name="aiModels"
                            component="div"
                            className="text-red-error text-sm mt-1"
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
                        className="text-red-error text-sm mt-1"
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
                  const selected = field.field.value || [];
                  const addDeliv = (val) => {
                    if (!val) return;
                    if (selected.includes(val)) return;
                    field.form.setFieldValue("deliverables", [
                      ...selected,
                      val,
                    ]);
                  };
                  const removeDeliv = (val) => {
                    field.form.setFieldValue(
                      "deliverables",
                      selected.filter((d) => d !== val)
                    );
                  };
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1">
                        Deliverables *
                      </label>
                      <select
                        className={baseInputClasses}
                        value=""
                        onChange={(e) => addDeliv(e.target.value)}
                      >
                        <option value="">Add a deliverable…</option>
                        {deliverables
                          .filter((o) => !selected.includes(o.value))
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selected.map((d) => {
                          const deliverable = deliverables.find(
                            (o) => o.value === d
                          );
                          return (
                            <span key={d} className="rounded-grid-small">
                              {deliverable ? deliverable.label : d}
                              <button
                                type="button"
                                onClick={() => removeDeliv(d)}
                                className="ml-2 text-gray-800"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                      <ErrorMessage
                        name="deliverables"
                        component="div"
                        className="text-red-error text-sm mt-1"
                      />
                    </div>
                  );
                }}
              </Field>

              <Field name="deliverablesCount">
                {(field) => {
                  const { baseInputClasses } = renderField(field);
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Deliverables *
                      </label>
                      <input
                        {...field.field}
                        type="number"
                        min="1"
                        placeholder="e.g., 3"
                        className={baseInputClasses}
                      />
                      <ErrorMessage
                        name="deliverablesCount"
                        component="div"
                        className="text-red-error text-sm mt-1"
                      />
                    </div>
                  );
                }}
              </Field>

              {values.deliverables &&
                values.deliverables.includes("others") && (
                  <Field name="deliverablesOther">
                    {(field) => {
                      const { hasError } = renderField(field);
                      return (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Other Deliverables{" "}
                            {values.deliverables &&
                            values.deliverables.includes("others")
                              ? "*"
                              : ""}
                          </label>
                          <MultiValueInput
                            value={field.field.value || []}
                            onChange={(newValues) =>
                              field.form.setFieldValue(
                                "deliverablesOther",
                                newValues
                              )
                            }
                            placeholder="Enter other deliverables (comma or space separated)..."
                            className={hasError ? "border-red-error" : ""}
                            maxValues={5}
                          />
                          <ErrorMessage
                            name="deliverablesOther"
                            component="div"
                            className="text-red-error text-sm mt-1"
                          />
                        </div>
                      );
                    }}
                  </Field>
                )}

              <Field name="reporters">
                {(field) => {
                  const { baseInputClasses } = renderField(field);
                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reporter *
                      </label>
                      <select {...field.field} className={baseInputClasses}>
                        <option value="">Select a reporter</option>
                        {reporters.map((reporter) => (
                          <option key={reporter.id} value={reporter.id}>
                            {reporter.name} ({reporter.email})
                          </option>
                        ))}
                      </select>
                      <ErrorMessage
                        name="reporters"
                        component="div"
                        className="text-red-error text-sm mt-1"
                      />
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
                  loadingText="Creating..."
                  disabled={!isFormValid()}
                >
                  Create Task
                </DynamicButton>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};

export default TaskForm;
