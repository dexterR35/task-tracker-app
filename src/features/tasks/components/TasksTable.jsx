import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "../tasksApi";
import { useCentralizedDataAnalytics } from "../../../shared/hooks/analytics/useCentralizedDataAnalytics";
import { useCacheManagement } from "../../../shared/hooks/useCacheManagement";
import { useAuth } from "../../../shared/hooks/useAuth";
import {
  taskNameOptions,
  marketOptions,
  productOptions,
  aiModelOptions,
  deliverables,
} from "../../../shared/utils/taskOptions";
import { useFormat } from "../../../shared/hooks/useFormat";
import { useGlobalMonthId } from "../../../shared/hooks/useGlobalMonthId";
import {
  sanitizeTaskData,
  sanitizeText,
} from "../../../shared/forms/sanitization";
import { logger } from "../../../shared/utils/logger";
import { showSuccess, showError, showInfo, showWarning } from "../../../shared/utils/toast";

import MultiValueInput from "../../../shared/forms/components/inputs/MultiValueInput";
import DynamicButton from "../../../shared/components/ui/DynamicButton";
import DynamicForm from "../../../shared/forms/components/DynamicForm";
import { FIELD_TYPES } from "../../../shared/forms/validation/fieldTypes";

const useFormatDay = () => {
  const { format } = useFormat();
  return useMemo(
    () => (ts) => {
      if (!ts) return "-";
      try {
        return format(ts, "MMM d");
      } catch (error) {
        logger.warn("Date formatting error:", error);
        return "Invalid Date";
      }
    },
    [format]
  );
};

const numberFmt = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : 0);

// Helper function to safely display task data
const safeDisplay = (value, fallback = "-") => {
  if (!value) return fallback;
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeText(v)).join(", ") || fallback;
  }
  return sanitizeText(value) || fallback;
};

const TasksTable = ({
  onSelect,
  error = null,
  tasks = [], // Tasks passed from parent component
}) => {
  const navigate = useNavigate();
  const { format } = useFormat();
  const { monthId } = useGlobalMonthId();

  // Tasks are already filtered by the server query, so use them directly
  const filteredTasks = tasks || [];

  const handleSelect = (t) => {
    if (typeof onSelect === "function") return onSelect(t);
    // Extract the document ID from the task ID (in case it's a full path)
    let taskId = t.id;
    if (typeof taskId === "string" && taskId.includes("/")) {
      const pathParts = taskId.split("/");
      taskId = pathParts[pathParts.length - 1];
    }

    // Ensure we have a valid monthId - use task's monthId or fallback to global monthId
    const taskMonthId = t.monthId || monthId;

    // Check if we're on admin route and use appropriate path
    const isAdminRoute = window.location.pathname.includes("/admin");
    const route = isAdminRoute
      ? `/admin/tasks/${taskMonthId}/${taskId}`
      : `/user/tasks/${taskMonthId}/${taskId}`;
      
    // Pass task data via navigation state for instant task detail view
    navigate(route, { 
      state: { taskData: t } 
    });
  };

  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [editingId, setEditingId] = useState(null);
  const [rowActionId, setRowActionId] = useState(null);
  const [formRef, setFormRef] = useState(null);
  const formatDay = useFormatDay();

  // Memoize the onFormReady callback to prevent infinite re-renders
  const handleFormReady = useCallback((formikProps) => {
    setFormRef(formikProps);
  }, []);

  // Get reporters for selection - only if authenticated
  const { user } = useAuth();
  
  // Only call analytics hook if authenticated and have valid monthId
  const shouldCallAnalytics = user && monthId && typeof monthId === 'string' && monthId.match(/^\d{4}-\d{2}$/);
  const { reporters = [] } = useCentralizedDataAnalytics(
    shouldCallAnalytics ? monthId : null
  );

  // Force re-render when form changes to update conditional columns
  const [forceUpdate, setForceUpdate] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  // Check if any task is being edited
  const isAnyTaskEditing = editingId !== null;

  // Pagination calculations
  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const startIdx = currentPage * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredTasks.length);
  const currentPageTasks = useMemo(
    () => filteredTasks.slice(startIdx, endIdx),
    [filteredTasks, startIdx, endIdx]
  );

  // Generate dynamic form configuration for task editing
  const getTaskFormConfig = useCallback((task) => {
    return [
      {
        name: 'taskName',
        type: FIELD_TYPES.SELECT,
        label: 'Task Type',
        required: true,
        options: taskNameOptions,
        validation: {
          custom: {
            test: (value) => {
              if (!value || value.trim() === '') return false;
              return true;
            },
            message: 'Please select a task type'
          }
        },
        helpText: 'Select the type of task being performed'
      },
      {
        name: 'markets',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Markets',
        required: true,
        options: marketOptions,
        validation: {
          minItems: 1,
          custom: {
            test: (value) => {
              if (!value || !Array.isArray(value) || value.length === 0) return false;
              return true;
            },
            message: 'Please select at least one market'
          }
        },
        helpText: 'Select all markets where this task applies',
        props: {
          maxItems: 10
        }
      },
      {
        name: 'product',
        type: FIELD_TYPES.SELECT,
        label: 'Product',
        required: true,
        options: productOptions,
        validation: {
          custom: {
            test: (value) => {
              if (!value || value.trim() === '') return false;
              return true;
            },
            message: 'Please select a product'
          }
        },
        helpText: 'Select the primary product this task relates to'
      },
      {
        name: 'timeInHours',
        type: FIELD_TYPES.NUMBER,
        label: 'Total Time (Hours)',
        required: true,
        validation: {
          minValue: 0.5,
          maxValue: 24,
          custom: {
            test: (value) => {
              if (!value || value < 0.5) return false;
              if (value > 24) return false;
              return true;
            },
            message: 'Time must be between 0.5 and 24 hours'
          }
        },
        placeholder: '2.5',
        helpText: 'Total time spent on this task (0.5 - 24 hours)',
        props: {
          step: 0.5,
          min: 0.5,
          max: 24
        }
      },
      {
        name: 'aiUsed',
        type: FIELD_TYPES.CHECKBOX,
        label: 'AI Tools Used',
        helpText: 'Check if AI tools were used in this task',
        props: {
          className: 'mt-2'
        }
      },
      {
        name: 'timeSpentOnAI',
        type: FIELD_TYPES.NUMBER,
        label: 'Time Spent on AI (Hours)',
        validation: {
          minValue: 0.5,
          maxValue: 24,
          custom: {
            test: (value, allValues) => {
              if (allValues.aiUsed && (!value || value < 0.5)) return false;
              if (value && value > allValues.timeInHours) return false;
              return true;
            },
            message: 'AI time must be between 0.5 hours and cannot exceed total time'
          }
        },
        placeholder: '1.0',
        helpText: 'Hours spent specifically using AI tools (auto-calculated based on AI models)',
        props: {
          step: 0.5,
          min: 0.5,
          max: 24
        },
        conditional: {
          field: 'aiUsed',
          value: true
        }
      },
      {
        name: 'aiModels',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'AI Models Used',
        validation: {
          minItems: 1,
          custom: {
            test: (value, allValues) => {
              if (allValues.aiUsed && (!value || !Array.isArray(value) || value.length === 0)) return false;
              return true;
            },
            message: 'Please select at least one AI model when AI is used'
          }
        },
        options: aiModelOptions,
        helpText: 'Select all AI models used in this task',
        props: {
          maxItems: 5
        },
        conditional: {
          field: 'aiUsed',
          value: true
        }
      },
      {
        name: 'reworked',
        type: FIELD_TYPES.CHECKBOX,
        label: 'Task Required Rework',
        helpText: 'Check if this task required rework or revisions',
        props: {
          className: 'mt-2'
        }
      },
      {
        name: 'deliverables',
        type: FIELD_TYPES.MULTI_SELECT,
        label: 'Deliverables',
        required: true,
        options: deliverables,
        validation: {
          minItems: 1,
          custom: {
            test: (value) => {
              if (!value || !Array.isArray(value) || value.length === 0) return false;
              return true;
            },
            message: 'Please select at least one deliverable'
          }
        },
        helpText: 'Select all deliverables produced by this task (count will be auto-calculated)',
        props: {
          maxItems: 8
        }
      },
      {
        name: 'deliverablesCount',
        type: FIELD_TYPES.NUMBER,
        label: 'Number of Deliverables',
        required: true,
        validation: {
          minValue: 1,
          maxValue: 100,
          custom: {
            test: (value, allValues) => {
              if (!value || value < 1) return false;
              if (allValues.deliverables && Array.isArray(allValues.deliverables)) {
                const expectedCount = allValues.deliverables.length;
                if (value < expectedCount) return false;
              }
              return true;
            },
            message: 'Deliverables count must be at least 1 and match selected deliverables'
          }
        },
        placeholder: '1',
        helpText: 'Total number of deliverables produced (auto-calculated from selection)',
        props: {
          step: 1,
          min: 1,
          max: 100
        }
      },
      {
        name: 'deliverablesOther',
        type: FIELD_TYPES.MULTI_VALUE,
        label: 'Other Deliverables',
        validation: {
          minItems: 1,
          custom: {
            test: (value, allValues) => {
              if (allValues.deliverables && allValues.deliverables.includes('others')) {
                if (!value || !Array.isArray(value) || value.length === 0) return false;
              }
              return true;
            },
            message: 'Please specify other deliverables when "Others" is selected'
          }
        },
        placeholder: 'Enter deliverable name',
        helpText: 'Specify other deliverables not listed in the main options',
        props: {
          maxValues: 5,
          addButtonText: 'Add Deliverable',
          removeButtonText: 'Remove'
        },
        conditional: {
          field: 'deliverables',
          value: 'others',
          operator: 'includes'
        }
      },
      {
        name: 'reporters',
        type: FIELD_TYPES.SELECT,
        label: 'Reporter',
        required: true,
        options: reporters.map(reporter => ({
          value: reporter.id,
          label: `${reporter.name} (${reporter.email})`
        })),
        validation: {
          custom: {
            test: (value) => {
              if (!value || value.trim() === '') return false;
              return true;
            },
            message: 'Please select a reporter'
          }
        },
        helpText: 'Select the person responsible for this task (defaults to current user)',
        props: {
          autoComplete: 'off'
        }
      }
    ];
  }, [reporters]);

  // Handle page change from ReactPaginate
  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  // Reset to first page when tasks change
  useEffect(() => {
    setCurrentPage(0);
  }, [filteredTasks.length]);

  useEffect(() => {
    if (isAnyTaskEditing) {
      setForceUpdate((prev) => prev + 1);
    }
  }, [isAnyTaskEditing]);

  // Force re-render when tasks change to ensure cache updates are reflected
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [filteredTasks.length]);

  const startEdit = (t) => {
    // Extract the document ID from the task ID (in case it's a full path)
    let taskId = t.id;
    if (typeof taskId === "string" && taskId.includes("/")) {
      const pathParts = taskId.split("/");
      taskId = pathParts[pathParts.length - 1];
    }
    setEditingId(taskId);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (formData, formikHelpers) => {
    try {
      const task = currentPageTasks.find(t => {
        let taskId = t.id;
        if (typeof taskId === "string" && taskId.includes("/")) {
          const pathParts = taskId.split("/");
          taskId = pathParts[pathParts.length - 1];
        }
        return taskId === editingId;
      });

      if (!task) {
        showError("Task not found");
        return;
      }

      setRowActionId(task.id);

      // Prepare form data for sanitization
      const sanitizedUpdates = sanitizeTaskData(formData);
      logger.debug("Sanitized updates:", sanitizedUpdates);

      // Quantize time values (round to nearest 0.5)
      const quant = (n) => Math.round((Number(n) || 0) * 2) / 2;
      const updates = {
        ...sanitizedUpdates,
        timeInHours: quant(sanitizedUpdates.timeInHours),
        timeSpentOnAI: sanitizedUpdates.aiUsed
          ? quant(sanitizedUpdates.timeSpentOnAI)
          : 0,
      };

      logger.debug("Final updates object:", updates);

      // Update task using Redux mutation (automatically updates cache)
      // Extract the document ID from the task ID (in case it's a full path)
      let taskId = task.id;
      logger.debug("Processing task ID:", taskId);
      if (typeof taskId === "string" && taskId.includes("/")) {
        // If it's a full path like "tasks/monthTasks/gYMI5ZUOGgoY1isWCdPP"
        const pathParts = taskId.split("/");
        taskId = pathParts[pathParts.length - 1]; // Get the last part
      }

      // Preserve the original monthId from the task
      const taskMonthId = task.monthId || monthId;

      // Ensure the monthId is included in the updates
      const updatesWithMonthId = {
        ...updates,
        monthId: taskMonthId, // Ensure monthId is preserved
      };

      await updateTask({
        monthId: taskMonthId,
        id: taskId,
        updates: updatesWithMonthId,
      }).unwrap();
      logger.log("[TasksTable] updated task", {
        id: task.id,
        monthId: taskMonthId,
        updates: updatesWithMonthId,
      });
      
      showSuccess("Task updated successfully!");
      setEditingId(null);
    } catch (e) {
      logger.error("Task update error:", e);
      showError(`Failed to update task: ${e?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
    }
  };

  const removeTask = async (t) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      setRowActionId(t.id);

      // Extract the document ID from the task ID (in case it's a full path)
      let taskId = t.id;
      if (typeof taskId === "string" && taskId.includes("/")) {
        const pathParts = taskId.split("/");
        taskId = pathParts[pathParts.length - 1];
      }

      // Preserve the original monthId from the task
      const taskMonthId = t.monthId || monthId;

      // Delete task using Redux mutation (automatically updates cache)
      await deleteTask({ monthId: taskMonthId, id: taskId }).unwrap();
      
      showSuccess("Task deleted successfully!");
    } catch (e) {
      logger.error("Task delete error:", e);
      showError(`Failed to delete task: ${e?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
    }
  };

  // Determine loading state
  const hasError = error;

  // Show error state
  if (hasError) {
    return (
      <div className=" card border text-center text-white-dark">
        <p className="text-sm mb-4">
          Error loading tasks: {hasError?.message || "Unknown error"}
        </p>
        <DynamicButton
          onClick={() => window.location.reload()}
          variant="danger"
          iconName="alert"
          iconPosition="left"
          size="sm"
        >
          Refresh Page
        </DynamicButton>
      </div>
    );
  }

  // Show empty state
  if (!filteredTasks.length) {
    return (
      <div className="card text-center text-sm text-white-dark">
        No tasks found for this month.
      </div>
    );
  }

  return (
    <div className="card p-4 overflow-x-auto">
      <div className="flex-center !mx-0 !justify-between p-3 text-xs text-gray-300">
        <div>
          Showing {startIdx + 1}–{endIdx} of {filteredTasks.length} tasks
        </div>
        <div>
          <label className="flex items-center gap-2 ">
            Page size:
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="border rounded px-1 py-1 text-xs "
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <table className="min-w-full text-xs">
        <thead className=" capitalize">
          <tr>
            <th># ID</th>
            <th>for</th>
            <th>Markets</th>
            <th>Product</th>
            {/* <th>Created</th> */}
            <th>Hours</th>
            <th>AI Hr</th>
            <th>AI Models</th>
            <th>AI?</th>
            <th>Reworked?</th>
            <th>Deliverables</th>
            {(currentPageTasks.some((currentTask) => {
              const deliverables = Array.isArray(currentTask.deliverables)
                ? currentTask.deliverables
                : currentTask.deliverable
                  ? [currentTask.deliverable]
                  : [];
              return deliverables.includes("others");
            })) && (
              <th key={`others-header-${forceUpdate}`}>Other Deliverables</th>
            )}
            <th>Reporters</th>
            <th>Nr deliverables</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPageTasks.map((t) => {
            let taskId = t.id;
            if (typeof taskId === "string" && taskId.includes("/")) {
              const pathParts = taskId.split("/");
              taskId = pathParts[pathParts.length - 1];
            }
            const isEdit = editingId === taskId;
            
            return (
              <tr
                key={taskId}
                className={` cursor-pointer border-t ${isEdit ? "bg-inherit" : "hover:bg-gray-700/90"} `}
              >
                {isEdit ? (
                  // Edit mode - show dynamic form
                  <td colSpan="14" className="p-4">
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Edit Task: {safeDisplay(t.taskNumber)}</h3>
                        <div className="flex space-x-2">
                          <DynamicButton
                            variant="success"
                            size="sm"
                            onClick={() => {
                              // Trigger form submission using form reference
                              if (formRef && formRef.submitForm) {
                                formRef.submitForm();
                              }
                            }}
                            iconName="save"
                            iconPosition="left"
                            disabled={rowActionId === t.id}
                          >
                            Save
                          </DynamicButton>
                          <DynamicButton
                            variant="danger"
                            size="sm"
                            onClick={cancelEdit}
                            iconName="cancel"
                            iconPosition="left"
                          >
                            Cancel
                          </DynamicButton>
                        </div>
                      </div>
                      
                      <DynamicForm
                        fields={getTaskFormConfig(t)}
                        initialValues={{
                          taskName: t.taskName || "",
                          markets: Array.isArray(t.markets)
                            ? t.markets
                            : t.market
                              ? [t.market]
                              : [],
                          product: t.product || "",
                          timeInHours: t.timeInHours || 0,
                          timeSpentOnAI: t.timeSpentOnAI || 0,
                          aiUsed: Boolean(t.aiUsed),
                          aiModels: Array.isArray(t.aiModels)
                            ? t.aiModels
                            : t.aiModels === false
                              ? false
                              : [],
                          reworked: Boolean(t.reworked),
                          deliverables: Array.isArray(t.deliverables)
                            ? t.deliverables
                            : t.deliverable
                              ? [String(t.deliverable)]
                              : [],
                          deliverablesOther: Array.isArray(t.deliverablesOther)
                            ? t.deliverablesOther
                            : t.deliverablesOther === false
                              ? false
                              : [],
                          deliverablesCount: Number(t.deliverablesCount) || 0,
                          reporters: t.reporters || "",
                        }}
                        onSubmit={saveEdit}
                        submitText="Update Task"
                        submitButtonProps={{
                          loadingText: "Updating...",
                          iconName: "save",
                          iconPosition: "left",
                          variant: "success",
                          size: "sm"
                        }}
                        showSubmitButton={false} // We handle the submit button manually
                        context={{ user, monthId, reporters }}
                        onFormReady={handleFormReady}
                        onFieldChange={(fieldName, value, formikHelpers) => {
                          // Auto-calculation features
                          if (fieldName === 'deliverables') {
                            const deliverablesCount = Array.isArray(value) ? value.length : 0;
                            formikHelpers.setFieldValue('deliverablesCount', deliverablesCount);
                          }
                          
                          if (fieldName === 'aiModels') {
                            const aiModelsCount = Array.isArray(value) ? value.length : 0;
                            if (aiModelsCount > 0 && !formikHelpers.values.timeSpentOnAI) {
                              const suggestedTime = Math.max(0.5, aiModelsCount * 0.5);
                              formikHelpers.setFieldValue('timeSpentOnAI', suggestedTime);
                              showInfo(`Suggested AI time: ${suggestedTime} hours`);
                            }
                          }
                        }}
                        className="max-w-4xl mx-auto"
                      />
                    </div>
                  </td>
                ) : (
                  // View mode - show regular table row
                  <>
                    <td className="truncate max-w-[60px]">
                      {safeDisplay(t.taskNumber)}
                    </td>
                    <td className="truncate max-w-[100px]">
                      {safeDisplay(t.taskName)}
                    </td>
                    <td className="truncate max-w-[120px]">
                      {safeDisplay(t.markets || t.market)}
                    </td>
                    <td className="truncate max-w-[120px]">
                      {safeDisplay(t.product)}
                    </td>
                    {/* <td>{formatDay(t.createdAt)}</td> */}
                    <td className="truncate max-w-[70px]">
                      {numberFmt(parseFloat(t.timeInHours) || 0)}
                    </td>
                    <td className="truncate max-w-[80px]">
                      {numberFmt(parseFloat(t.timeSpentOnAI) || 0)}
                    </td>
                    <td>
                      {t.aiUsed ? (
                        t.aiModels && t.aiModels !== false ? (
                          safeDisplay(t.aiModels || t.aiModel)
                        ) : (
                          "-"
                        )
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="text-center">
                      {t.aiUsed ? "✓" : "-"}
                    </td>
                    <td className="text-center">
                      {t.reworked ? "✓" : "-"}
                    </td>
                    <td>
                      {safeDisplay(t.deliverables || t.deliverable)}
                    </td>
                    {(() => {
                      const hasOthersInAnyTask = currentPageTasks.some((currentTask) => {
                        const deliverables = Array.isArray(currentTask.deliverables)
                          ? currentTask.deliverables
                          : currentTask.deliverable
                            ? [currentTask.deliverable]
                            : [];
                        return deliverables.includes("others");
                      });

                      if (!hasOthersInAnyTask) return null;

                      const deliverables = Array.isArray(t.deliverables)
                        ? t.deliverables
                        : t.deliverable
                          ? [t.deliverable]
                          : [];
                      const shouldShowOthers = deliverables.includes("others");

                      return (
                        <td key={`others-cell-${forceUpdate}`}>
                          {!shouldShowOthers ? (
                            "-"
                          ) : t.deliverablesOther &&
                            t.deliverablesOther !== false ? (
                            safeDisplay(t.deliverablesOther)
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })()}
                    <td className="truncate max-w-[120px]">
                      {(() => {
                        const reporter = reporters.find(
                          (r) => r.id === t.reporters || r.reporterUID === t.reporters
                        );
                        return reporter
                          ? `${reporter.name} (${reporter.email})`
                          : t.reporters || "No reporter";
                      })()}
                    </td>
                    <td>
                      {Number(t.deliverablesCount) || 0}
                    </td>
                    <td className="text-start space-x-2 flex flex-row">
                      <DynamicButton
                        variant="primary"
                        size="xs"
                        onClick={() => handleSelect(t)}
                        title="View Task"
                      >
                        View
                      </DynamicButton>
                      <DynamicButton
                        variant="edit"
                        size="xs"
                        disabled={rowActionId === t.id}
                        onClick={() => startEdit(t)}
                        iconName="edit"
                        iconPosition="center"
                      />
                      <DynamicButton
                        variant="danger"
                        size="xs"
                        disabled={rowActionId === t.id}
                        onClick={() => removeTask(t)}
                        iconName="delete"
                        iconPosition="center"
                        className={
                          rowActionId === t.id
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      />
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageCount > 1 && (
        <div className="p-3">
          <ReactPaginate
            pageCount={pageCount}
            pageRangeDisplayed={5}
            marginPagesDisplayed={2}
            onPageChange={handlePageChange}
            forcePage={currentPage}
            containerClassName="flex justify-center space-x-1"
            pageClassName="px-3 py-1 border rounded text-gray-700"
            activeClassName="bg-blue-500 text-white border-blue-500"
            previousClassName="px-3 py-1 border rounded 0 text-gray-700"
            nextClassName="px-3 py-1 border rounded  text-gray-700"
            disabledClassName="opacity-50 cursor-not-allowed text-gray-400"
            previousLabel="Previous"
            nextLabel="Next"
            breakLabel="..."
          />
        </div>
      )}
    </div>
  );
};

export default TasksTable;
