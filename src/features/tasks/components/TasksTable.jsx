import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "../tasksApi";
import { useSubscribeToReportersQuery } from "../../reporters/reportersApi";
import {
  taskNameOptions,
  marketOptions,
  productOptions,
  aiModelOptions,
  deliverables,
} from "../../../shared/utils/taskOptions";
import { useFormat } from "../../../shared/hooks/useFormat";
import {
  sanitizeTaskData,
  sanitizeText,
} from "../../../shared/utils/sanitization";
import { showSuccess, showError } from "../../../shared/utils/toast";
import { logger } from "../../../shared/utils/logger";

import MultiValueInput from "../../../shared/components/ui/MultiValueInput";
import DynamicButton from "../../../shared/components/ui/DynamicButton";

const useFormatDay = () => {
  const { format } = useFormat();
  return useMemo(
    () => (ts) => {
      if (!ts) return "-";
      try {
        return format(ts, "MMM d");
      } catch (error) {
        console.warn("Date formatting error:", error);
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
  monthId,
  onSelect,
  error = null,
  tasks = [], // Tasks passed from parent component
}) => {
  const navigate = useNavigate();
  const { format } = useFormat();

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

    // Ensure we have a valid monthId
    const monthId = t.monthId || format(new Date(), "yyyy-MM");

    // Check if we're on admin route and use appropriate path
    const isAdminRoute = window.location.pathname.includes("/admin");
    const route = isAdminRoute
      ? `/admin/task/${monthId}/${taskId}`
      : `/task/${monthId}/${taskId}`;
    navigate(route);
  };

  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [rowActionId, setRowActionId] = useState(null);
  const formatDay = useFormatDay();

  // Get reporters for selection
  const { data: reporters = [] } = useSubscribeToReportersQuery();

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
  }, [form.deliverables, form.aiUsed, isAnyTaskEditing]);

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

    // Sanitize the task data before setting it in the form
    const sanitizedTask = sanitizeTaskData(t);

    setForm({
      taskName: sanitizedTask.taskName || "",
      markets: Array.isArray(sanitizedTask.markets)
        ? sanitizedTask.markets
        : sanitizedTask.market
          ? [sanitizedTask.market]
          : [],
      product: sanitizedTask.product || "",
      timeInHours: sanitizedTask.timeInHours || 0,
      timeSpentOnAI: sanitizedTask.timeSpentOnAI || 0,
      aiUsed: Boolean(sanitizedTask.aiUsed),
      aiModels: Array.isArray(sanitizedTask.aiModels)
        ? sanitizedTask.aiModels
        : sanitizedTask.aiModels === false
          ? false
          : [],
      reworked: Boolean(sanitizedTask.reworked),
      deliverables: Array.isArray(sanitizedTask.deliverables)
        ? sanitizedTask.deliverables
        : sanitizedTask.deliverable
          ? [String(sanitizedTask.deliverable)]
          : [],
      deliverablesOther: Array.isArray(sanitizedTask.deliverablesOther)
        ? sanitizedTask.deliverablesOther
        : sanitizedTask.deliverablesOther === false
          ? false
          : [],
      deliverablesCount: Number(sanitizedTask.deliverablesCount) || 0,
      reporters: sanitizedTask.reporters || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const saveEdit = async (t) => {
    try {
      logger.debug("Task object for update:", t);
      logger.debug("Task ID type:", typeof t.id);
      logger.debug("Task ID value:", t.id);
      logger.debug("Task ID includes slash:", t.id.includes("/"));
      logger.debug("Task number:", t.taskNumber);
      logger.debug("Task monthId:", t.monthId);
      setRowActionId(t.id);

      // Prepare form data for sanitization
      const formData = {
        taskName: form.taskName || "",
        product: form.product || "",
        markets: Array.isArray(form.markets) ? form.markets : [],
        aiUsed: Boolean(form.aiUsed),
        // Always use arrays - empty array if not selected
        aiModels: Array.isArray(form.aiModels) ? form.aiModels : [],
        deliverables: Array.isArray(form.deliverables) ? form.deliverables : [],
        reworked: Boolean(form.reworked),
        timeInHours: Number(form.timeInHours) || 0,
        timeSpentOnAI: form.aiUsed ? Number(form.timeSpentOnAI) || 0 : 0,
        taskNumber: t.taskNumber || "", // Preserve the original task number
        jiraLink: t.jiraLink || "", // Preserve the original Jira link
        // Always use arrays - empty array if not selected
        deliverablesOther: Array.isArray(form.deliverablesOther)
          ? form.deliverablesOther
          : [],
        deliverablesCount: Number(form.deliverablesCount) || 0, // Use form value for deliverablesCount
        reporters: form.reporters || "", // Use form value for reporters
        createdBy: t.createdBy || "", // Preserve creator info
        createdByName: t.createdByName || "", // Preserve creator name
        userUID: t.userUID || "", // Preserve user UID
      };

      logger.debug("Form data before sanitization:", formData);

      // Sanitize the form data
      const sanitizedUpdates = sanitizeTaskData(formData);
      logger.debug("Sanitized updates:", sanitizedUpdates);

      // Additional validation for required fields
      const errs = [];
      if (!sanitizedUpdates.taskName) errs.push("Task");
      if (!sanitizedUpdates.product) errs.push("Product");
      if (!sanitizedUpdates.markets.length) errs.push("Markets");
      if (!sanitizedUpdates.deliverables.length) errs.push("Deliverables");
      if (!sanitizedUpdates.reporters) errs.push("Reporters");
      if (sanitizedUpdates.timeInHours < 0.5) errs.push("Hours ≥ 0.5");

      // Validate AI fields only if AI is used
      if (sanitizedUpdates.aiUsed) {
        if (
          !Array.isArray(sanitizedUpdates.aiModels) ||
          sanitizedUpdates.aiModels.length === 0
        ) {
          errs.push("AI Models (required when AI is used)");
        }
        if (sanitizedUpdates.timeSpentOnAI < 0.5) {
          errs.push("AI Hours ≥ 0.5 (required when AI is used)");
        }
      }

      // Validate "others" deliverables only if "others" is selected
      if (sanitizedUpdates.deliverables.includes("others")) {
        if (
          !Array.isArray(sanitizedUpdates.deliverablesOther) ||
          sanitizedUpdates.deliverablesOther.length === 0
        ) {
          errs.push('Other Deliverables (required when "others" is selected)');
        }
      }

      if (errs.length) {
        showError("Please complete: " + errs.join(", "));
        setRowActionId(null);
        return;
      }

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
      let taskId = t.id;
      if (typeof taskId === "string" && taskId.includes("/")) {
        // If it's a full path like "tasks/monthTasks/gYMI5ZUOGgoY1isWCdPP"
        const pathParts = taskId.split("/");
        taskId = pathParts[pathParts.length - 1]; // Get the last part
      }

      // Preserve the original monthId from the task
      const taskMonthId = t.monthId || format(new Date(), "yyyy-MM");

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
        id: t.id,
        monthId: taskMonthId,
        updates: updatesWithMonthId,
      });
      showSuccess("Task updated successfully!");
    } catch (e) {
      logger.error("Task update error:", e);
      showError(`Failed to update task: ${e?.message || "Please try again."}`);
    } finally {
      setEditingId(null);
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
      const taskMonthId = t.monthId || format(new Date(), "yyyy-MM");

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
          size="sm
          "
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
    <div className="card p-4 overflow-x-auto ">
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
            {(currentPageTasks.some((t) => {
              const deliverables = Array.isArray(t.deliverables)
                ? t.deliverables
                : t.deliverable
                  ? [t.deliverable]
                  : [];
              return deliverables.includes("others");
            }) ||
              (isAnyTaskEditing &&
                form.deliverables &&
                form.deliverables.includes("others"))) && (
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
                <td className="truncate max-w-[60px]  ">
                  {safeDisplay(t.taskNumber)}
                </td>
                <td className="truncate max-w-[100px] ">
                  {isEdit ? (
                    <select
                      className=" px-2 py-2.5.5 w-full "
                      value={form.taskName}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          taskName: sanitizeText(e.target.value),
                        }))
                      }
                    >
                      <option value="">Select For</option>
                      {taskNameOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    safeDisplay(t.taskName)
                  )}
                </td>
                <td className="truncate max-w-[120px] ">
                  {isEdit ? (
                    <div>
                      <select
                        className="px-2 py-2.5.5 w-full "
                        value=""
                        onChange={(e) => {
                          const val = sanitizeText(e.target.value);
                          if (!val) return;
                          setForm((f) => ({
                            ...f,
                            markets: (f.markets || []).includes(val)
                              ? f.markets
                              : [...(f.markets || []), val],
                          }));
                        }}
                      >
                        <option value="">Add market</option>
                        {marketOptions
                          .filter(
                            (o) => !(form.markets || []).includes(o.value)
                          )
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                      <div className="mt-2 flex flex-wrap gap-1 uppercase">
                        {(form.markets || []).map((m) => (
                          <span key={m} className="rounded-grid-small">
                            {m}
                            <DynamicButton
                              type="button"
                              className="!ml-2 !p-1 text-xs !m-0 !h-auto !bg-transparent !text-gray-700 !shadow-none"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  markets: (f.markets || []).filter(
                                    (x) => x !== m
                                  ),
                                }))
                              }
                            >
                              ×
                            </DynamicButton>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    safeDisplay(t.markets || t.market)
                  )}
                </td>
                <td className="truncate max-w-[120px] ">
                  {isEdit ? (
                    <select
                      className=" px-2 py-2.5 rounded w-full"
                      value={form.product}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          product: sanitizeText(e.target.value),
                        }))
                      }
                    >
                      <option value="">Select product</option>
                      {productOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    safeDisplay(t.product)
                  )}
                </td>
                {/* <td>{formatDay(t.createdAt)}</td> */}
                <td className="truncate max-w-[70px">
                  {isEdit ? (
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      className="border px-2 py-2.5 rounded text-left w-full "
                      value={form.timeInHours}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, timeInHours: e.target.value }))
                      }
                    />
                  ) : (
                    numberFmt(parseFloat(t.timeInHours) || 0)
                  )}
                </td>
                <td className="truncate max-w-[80px]">
                  {isEdit ? (
                    form.aiUsed ? (
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        className="border px-2 py-2.5 rounded w-full"
                        value={form.timeSpentOnAI}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            timeSpentOnAI: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <span className="text-white-dark">--</span>
                    )
                  ) : (
                    numberFmt(parseFloat(t.timeSpentOnAI) || 0)
                  )}
                </td>
                <td>
                  {isEdit ? (
                    form.aiUsed ? (
                      <div>
                        <select
                          className="border px-2 py-2.5 rounded w-full"
                          value=""
                          onChange={(e) => {
                            const v = sanitizeText(e.target.value);
                            if (!v) return;
                            setForm((f) => ({
                              ...f,
                              aiModels: (f.aiModels || []).includes(v)
                                ? f.aiModels
                                : [...(f.aiModels || []), v],
                            }));
                          }}
                        >
                          <option value="">Add model</option>
                          {aiModelOptions
                            .filter(
                              (o) => !(form.aiModels || []).includes(o.value)
                            )
                            .map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                        </select>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(form.aiModels || []).map((m) => (
                            <span key={m} className="rounded-grid-small">
                              {m}
                              <DynamicButton
                                type="button"
                                className="!ml-2 !p-1 text-xs !m-0 !h-auto !bg-transparent !text-gray-700 !shadow-none"
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    aiModels: (f.aiModels || []).filter(
                                      (x) => x !== m
                                    ),
                                  }))
                                }
                              >
                                ×
                              </DynamicButton>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-white-dark">AI off</span>
                    )
                  ) : t.aiUsed ? (
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
                  {isEdit ? (
                    <input
                      type="checkbox"
                      checked={form.aiUsed}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          aiUsed: e.target.checked,
                          ...(e.target.checked
                            ? {}
                            : { timeSpentOnAI: 0, aiModels: false }),
                        }))
                      }
                    />
                  ) : t.aiUsed ? (
                    "✓"
                  ) : (
                    "-"
                  )}
                </td>
                <td className=" text-center">
                  {isEdit ? (
                    <input
                      type="checkbox"
                      checked={form.reworked}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, reworked: e.target.checked }))
                      }
                    />
                  ) : t.reworked ? (
                    "✓"
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {isEdit ? (
                    <div>
                      <select
                        className="px-2 py-2.5"
                        value=""
                        onChange={(e) => {
                          const v = sanitizeText(e.target.value);
                          if (!v) return;
                          setForm((f) => ({
                            ...f,
                            deliverables: (f.deliverables || []).includes(v)
                              ? f.deliverables
                              : [...(f.deliverables || []), v],
                          }));
                        }}
                      >
                        <option value="">Add deliverable</option>
                        {deliverables
                          .filter(
                            (o) => !(form.deliverables || []).includes(o.value)
                          )
                          .map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                      </select>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(form.deliverables || []).map((d) => (
                          <span key={d} className="rounded-grid-small">
                            {d}
                            <DynamicButton
                              type="button"
                              className="!ml-2 !p-1 text-xs !m-0 !h-auto !bg-transparent !text-gray-700 !shadow-none"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  deliverables: (f.deliverables || []).filter(
                                    (x) => x !== d
                                  ),
                                }))
                              }
                            >
                              ×
                            </DynamicButton>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    safeDisplay(t.deliverables || t.deliverable)
                  )}
                </td>
                {(() => {
                  const hasOthersInAnyTask = currentPageTasks.some((task) => {
                    const deliverables = Array.isArray(task.deliverables)
                      ? task.deliverables
                      : t.deliverable
                        ? [t.deliverable]
                        : [];
                    return deliverables.includes("others");
                  });
                  const isEditingWithOthers =
                    isAnyTaskEditing &&
                    form.deliverables &&
                    form.deliverables.includes("others");

                  if (!hasOthersInAnyTask && !isEditingWithOthers) return null;

                  const deliverables = Array.isArray(t.deliverables)
                    ? t.deliverables
                    : t.deliverable
                      ? [t.deliverable]
                      : [];
                  const isEditingThisTask =
                    isAnyTaskEditing && editingId === taskId;
                  const shouldShowOthers =
                    deliverables.includes("others") ||
                    (isEditingThisTask &&
                      form.deliverables &&
                      form.deliverables.includes("others"));

                  return (
                    <td key={`others-cell-${forceUpdate}`}>
                      {!shouldShowOthers ? (
                        "-"
                      ) : isEditingThisTask ? (
                        <MultiValueInput
                          value={form.deliverablesOther || []}
                          onChange={(newValues) =>
                            setForm((f) => ({
                              ...f,
                              deliverablesOther: newValues,
                            }))
                          }
                          placeholder="Enter other deliverables"
                          maxValues={5}
                        />
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
                  {isEdit ? (
                    <div>
                      <select
                        className="border px-2 py-2.5  w-full"
                        value={form.reporters || ""}
                        onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            reporters: e.target.value,
                          }));
                        }}
                      >
                        <option value="">Select reporter…</option>
                        {reporters.map((reporter) => (
                          <option key={reporter.id} value={reporter.id}>
                            {reporter.name} ({reporter.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    (() => {
                      const reporter = reporters.find(
                        (r) => r.id === t.reporters
                      );
                      return reporter
                        ? `${reporter.name} (${reporter.email})`
                        : t.reporters || "No reporter";
                    })()
                  )}
                </td>
                <td>
                  {isEdit ? (
                    <input
                      type="number"
                      min="1"
                      className="px-2 py-2.5 rounded w-20 text-start"
                      value={form.deliverablesCount || 0}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          deliverablesCount: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  ) : (
                    Number(t.deliverablesCount) || 0
                  )}
                </td>
                <td className="text-start space-x-2 flex flex-row">
                  {isEdit ? (
                    <>
                      <DynamicButton
                        variant="success"
                        size="xs"
                        onClick={() => saveEdit(t)}
                        iconName="save"
                        iconPosition="center"
                        disabled={
                          rowActionId === taskId ||
                          !(() => {
                            // Custom validation logic for table edit
                            if (
                              !form.taskName ||
                              !form.product ||
                              !form.markets?.length ||
                              !form.deliverables?.length ||
                              !form.timeInHours ||
                              form.timeInHours < 0.5 ||
                              !form.reporters
                            ) {
                              return false;
                            }

                            // AI validation only if AI is used
                            if (form.aiUsed) {
                              if (
                                !form.aiModels?.length ||
                                !form.timeSpentOnAI ||
                                form.timeSpentOnAI < 0.5
                              ) {
                                return false;
                              }
                            }

                            // Other deliverables validation only if "others" is selected
                            if (form.deliverables?.includes("others")) {
                              if (!form.deliverablesOther?.length) {
                                return false;
                              }
                            }

                            return true;
                          })()
                        }
                      />

                      <DynamicButton
                        variant="danger"
                        size="xs"
                        onClick={cancelEdit}
                        iconName="cancel"
                        iconPosition="center"
                      />
                    </>
                  ) : (
                    <>
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
                        disabled={rowActionId === taskId}
                        onClick={() => startEdit(t)}
                        iconName="edit"
                        iconPosition="center"
                      />
                      <DynamicButton
                        variant="danger"
                        size="xs"
                        disabled={rowActionId === taskId}
                        onClick={() => removeTask(t)}
                        iconName="delete"
                        iconPosition="center"
                        className={
                          rowActionId === taskId
                            ? "bg-red-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700"
                        }
                      />
                    </>
                  )}
                </td>
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
