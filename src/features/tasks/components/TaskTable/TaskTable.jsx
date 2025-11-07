import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import TanStackTable from "@/components/Table/TanStackTable";
import { useTaskColumns } from "@/components/Table/tableColumns.jsx";
import { useTableActions } from "@/hooks/useTableActions";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import { useDeleteTask } from "@/features/tasks/tasksApi";
import { showError, showAuthError, showSuccess } from "@/utils/toast";
import SearchableSelectField from "@/components/forms/components/SearchableSelectField";
import { TABLE_SYSTEM, FORM_OPTIONS } from "@/constants";
import { logger } from "@/utils/logger";

// Available filter options
const FILTER_OPTIONS = [
  { value: "aiUsed", label: "AI Used" },
  { value: "marketing", label: "Marketing" },
  { value: "acquisition", label: "Acquisition" },
  { value: "product", label: "Product" },
  { value: "vip", label: "VIP" },
  { value: "reworked", label: "Reworked" },
];

// import './TaskTable.css';

const TaskTable = ({
  className = "",
  selectedUserId = "",
  selectedReporterId = "",
  selectedMonthId = null,
  selectedWeek = null,
  error: tasksError = null,
  isLoading: initialLoading = false,
  onCountChange = null,
  enablePagination = true,
  pageSize = TABLE_SYSTEM.DEFAULT_PAGE_SIZE,
}) => {
  // Filter state - single selection only
  const [selectedFilter, setSelectedFilter] = useState(null);
  // Department filter state
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] =
    useState(null);
  // Deliverable filter state
  const [selectedDeliverableFilter, setSelectedDeliverableFilter] =
    useState(null);

  // Modal states - using table actions system instead

  // Page size state for TanStack pagination
  const [pageSizeState, setPageSizeState] = useState(pageSize);

  // Table ref for clearing selection
  const tableRef = useRef(null);

  // Get auth functions separately
  const { canAccess, user, canDeleteTask, canUpdateTask, canViewTasks } =
    useAuth();
  const isUserAdmin = canAccess("admin");
  const userCanDeleteTasks = canDeleteTask();
  const userCanUpdateTasks = canUpdateTask();
  const userCanViewTasks = canViewTasks();

  // Get navigate function for React Router navigation
  const navigate = useNavigate();

  // Get data from useAppData hook
  const {
    tasks: contextTasks,
    reporters,
    deliverables,
    user: userData,
    users,
  } = useAppDataContext();

  // Use context tasks with TanStack pagination
  const tasks = contextTasks || [];
  const isLoading = initialLoading;
  const error = tasksError;

  // Get delete task hook
  const [deleteTask] = useDeleteTask();

  // Delete wrapper - simplified since useTableActions now handles permission errors
  const handleTaskDeleteMutation = async (task) => {
    if (!deleteTask) {
      throw new Error("Delete task mutation not available");
    }

    try {
      await deleteTask(
        task.monthId, // Always use task's own monthId
        task.id,
        userData || {} // Pass user data for permission validation
      );
      // Note: Success toast is already shown by useTableActions hook
    } catch (error) {
      showError(`Failed to delete task: ${error.message}`);
      throw error; // Re-throw to maintain error handling in bulk operations
    }
  };

  // Use table actions hook
  const {
    showEditModal: showTableEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    rowActionId,
    handleSelect,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeEditModal,
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions("task", {
    getItemDisplayName: (task) => {
      if (task?.data_task?.taskName) return task.data_task.taskName;
      if (task?.data_task?.departments) {
        const departments = task.data_task.departments;
        return Array.isArray(departments)
          ? departments.join(", ")
          : departments;
      }
      return task?.data_task?.taskName || task?.id;
    },
    deleteMutation: handleTaskDeleteMutation,
    onDeleteSuccess: () => {
      // Clear table selection after delete
      tableRef.current?.clearSelection();
    },
    onSelectSuccess: () => {
      // Don't clear selection immediately for view action - let navigation handle it
      // The selection will be cleared when the component unmounts or when user returns
    },
  });

  // Edit handling is now managed by useTableActions hook

  // Get task columns for the table
  const taskColumns = useTaskColumns(
    selectedMonthId,
    reporters,
    user,
    deliverables
  );

  // Page size change handler for TanStack pagination
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSizeState(newPageSize);
  }, []);

  // Extract stable user values
  const userUID = user?.userUID;

  // Helper functions to reduce duplication
  const matchesUser = useCallback((task, userId) => {
    return task.userUID === userId || task.createbyUID === userId;
  }, []);

  const getTaskData = useCallback((task) => {
    return task.data_task || task;
  }, []);

  const getTaskReporterId = useCallback((task) => {
    return task.data_task?.reporters || task.reporters;
  }, []);

  // Reusable filtering function with role-based access control
  const getFilteredTasks = useCallback(
    (
      tasks,
      selectedUserId,
      selectedReporterId,
      currentMonthId,
      selectedWeek,
      selectedFilter,
      selectedDepartmentFilter,
      selectedDeliverableFilter
    ) => {
      if (!tasks || !Array.isArray(tasks)) {
        return [];
      }

      // First apply month, user, and reporter filtering
      let filteredTasks = tasks.filter((task) => {
        // Always filter by month first
        if (currentMonthId && task.monthId !== currentMonthId) return false;

        // Role-based filtering: Regular users can only see their own tasks
        if (!isUserAdmin) {
          // Check if this task belongs to the current user
          const isUserTask = userUID && matchesUser(task, userUID);
          // Regular users can ONLY see their own tasks
          return isUserTask;
        }

        // Admin filtering logic
        // If both user and reporter are selected, show tasks that match BOTH
        if (selectedUserId && selectedReporterId) {
          const matchesSelectedUser = matchesUser(task, selectedUserId);
          const taskReporterId = getTaskReporterId(task);
          if (!taskReporterId) return false;

          // Compare task reporter ID directly with selectedReporterId (exact case)
          return matchesSelectedUser && taskReporterId === selectedReporterId;
        }

        // If only user is selected, show tasks for that user
        if (selectedUserId && !selectedReporterId) {
          return matchesUser(task, selectedUserId);
        }

        // If only reporter is selected, show tasks for that reporter
        if (selectedReporterId && !selectedUserId) {
          const taskReporterId = getTaskReporterId(task);
          if (!taskReporterId) return false;

          // Compare task reporter ID directly with selectedReporterId (exact case)
          return taskReporterId === selectedReporterId;
        }

        // If neither user nor reporter is selected, admin sees all tasks
        return true;
      });

      // Apply department filter
      if (selectedDepartmentFilter) {
        if (import.meta.env.MODE === "development") {
          logger.log("Applying department filter:", selectedDepartmentFilter);
        }
        filteredTasks = filteredTasks.filter((task) => {
          const taskData = getTaskData(task);
          const taskDepartments = taskData.departments;

          // Normalize the selected filter to lowercase for comparison
          const normalizedFilter = selectedDepartmentFilter.toLowerCase();

          // Handle both array and string formats
          if (Array.isArray(taskDepartments)) {
            return taskDepartments.some(
              (dept) => dept?.toLowerCase() === normalizedFilter
            );
          } else if (typeof taskDepartments === "string") {
            return taskDepartments.toLowerCase() === normalizedFilter;
          }
          return false;
        });
      }

      // Apply deliverable filter
      if (selectedDeliverableFilter) {
        if (import.meta.env.MODE === "development") {
          logger.log("Applying deliverable filter:", selectedDeliverableFilter);
        }
        filteredTasks = filteredTasks.filter((task) => {
          const taskData = getTaskData(task);
          const deliverablesUsed = taskData.deliverablesUsed;

          if (
            !deliverablesUsed ||
            !Array.isArray(deliverablesUsed) ||
            deliverablesUsed.length === 0
          ) {
            return false;
          }

          // Check if any deliverable matches the selected filter
          return deliverablesUsed.some((deliverable) => {
            const deliverableName = deliverable?.name;
            return (
              deliverableName &&
              deliverableName.toLowerCase() ===
                selectedDeliverableFilter.toLowerCase()
            );
          });
        });
      }

      // Apply single filter selection
      if (selectedFilter) {
        if (import.meta.env.MODE === "development") {
          logger.log("Applying filter:", selectedFilter);
        }
        filteredTasks = filteredTasks.filter((task) => {
          const taskData = getTaskData(task);

          // Apply the selected filter
          switch (selectedFilter) {
            case "aiUsed":
              return taskData.aiUsed?.length > 0;
            case "marketing":
              return taskData.products?.includes("marketing");
            case "acquisition":
              return taskData.products?.includes("acquisition");
            case "product":
              return taskData.products?.includes("product");
            case "vip":
              return taskData.isVip;
            case "reworked":
              return taskData.reworked;
            default:
              return true;
          }
        });
      }

      // If a week is selected, filter by week
      if (selectedWeek && selectedWeek.days) {
        const weekTasks = [];
        selectedWeek.days.forEach((day) => {
          try {
            const dayDate = day instanceof Date ? day : new Date(day);
            if (isNaN(dayDate.getTime())) return;

            const dayStr = dayDate.toISOString().split("T")[0];
            const dayTasks = filteredTasks.filter((task) => {
              if (!task.createdAt) return false;

              // Handle Firestore Timestamp
              let taskDate;
              if (
                task.createdAt &&
                typeof task.createdAt === "object" &&
                task.createdAt.seconds
              ) {
                taskDate = new Date(task.createdAt.seconds * 1000);
              } else if (
                task.createdAt &&
                typeof task.createdAt === "object" &&
                task.createdAt.toDate
              ) {
                taskDate = task.createdAt.toDate();
              } else {
                taskDate = new Date(task.createdAt);
              }

              if (isNaN(taskDate.getTime())) return false;
              const taskDateStr = taskDate.toISOString().split("T")[0];
              return taskDateStr === dayStr;
            });
            weekTasks.push(...dayTasks);
          } catch (error) {
            logger.warn("Error processing day:", error, day);
          }
        });
        filteredTasks = weekTasks;
      }

      return filteredTasks;
    },
    [isUserAdmin, userUID, matchesUser, getTaskData, getTaskReporterId]
  );

  // Get filtered tasks and sort by createdAt (newest first) - memoized for performance
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }
    const filtered = getFilteredTasks(
      tasks,
      selectedUserId,
      selectedReporterId,
      selectedMonthId,
      selectedWeek,
      selectedFilter,
      selectedDepartmentFilter,
      selectedDeliverableFilter
    );

    // Sort by createdAt in descending order (newest first)
    return filtered.sort((a, b) => {
      // Handle Firebase Timestamps and different date formats
      let dateA, dateB;

      if (a.createdAt) {
        // Handle Firebase Timestamp objects
        if (a.createdAt.seconds) {
          dateA = new Date(a.createdAt.seconds * 1000);
        } else if (a.createdAt.toDate) {
          dateA = a.createdAt.toDate();
        } else {
          dateA = new Date(a.createdAt);
        }
      } else {
        dateA = new Date(0);
      }

      if (b.createdAt) {
        // Handle Firebase Timestamp objects
        if (b.createdAt.seconds) {
          dateB = new Date(b.createdAt.seconds * 1000);
        } else if (b.createdAt.toDate) {
          dateB = b.createdAt.toDate();
        } else {
          dateB = new Date(b.createdAt);
        }
      } else {
        dateB = new Date(0);
      }

      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }, [
    tasks,
    selectedUserId,
    selectedReporterId,
    selectedMonthId,
    selectedWeek,
    selectedFilter,
    selectedDepartmentFilter,
    selectedDeliverableFilter,
    getFilteredTasks,
  ]);

  // Bulk actions - build array efficiently without re-creation
  const bulkActions = useMemo(() => {
    const actions = [];

    // Always add Jira link action first
    actions.push({
      label: "View Jira Link",
      icon: "code",
      variant: "secondary",
      onClick: (selectedTasks) => {
        if (selectedTasks.length === 1) {
          const task = selectedTasks[0];
          const taskName = task.data_task?.taskName;

          if (taskName) {
            const fullJiraUrl = `https://gmrd.atlassian.net/browse/${taskName}`;
            window.open(fullJiraUrl, "_blank", "noopener,noreferrer");
          } else {
            showError("No Jira ticket or URL available for this task");
          }
        } else {
          showError("Please select only ONE task to view Jira link");
        }
      },
    });

    // Add view action if user has permission
    if (userCanViewTasks) {
      actions.push({
        label: "View Selected",
        icon: "eye",
        variant: "secondary",
        onClick: (selectedTasks) => {
          if (selectedTasks.length === 1) {
            const task = selectedTasks[0];
            const params = new URLSearchParams();
            if (task.monthId) params.set("monthId", task.monthId);
            if (task.createdByName) params.set("user", task.createdByName);
            navigate(`/task/${task.id}?${params.toString()}`);
          } else {
            showError("Please select only ONE task to view");
          }
        },
      });
    }

    // Add edit action if user has permission
    if (userCanUpdateTasks) {
      actions.push({
        label: "Edit Selected",
        icon: "edit",
        variant: "primary",
        onClick: (selectedTasks) => {
          if (selectedTasks.length === 1) {
            handleEdit(selectedTasks[0]);
          } else {
            showError("Please select only ONE task to edit");
          }
        },
      });
    }

    // Add delete action if user has permission
    if (userCanDeleteTasks) {
      actions.push({
        label: "Delete Selected",
        icon: "delete",
        variant: "crimson",
        onClick: async (selectedTasks) => {
          if (selectedTasks.length === 1) {
            handleDelete(selectedTasks[0]);
          } else {
            showError("Please select only ONE task to delete");
          }
        },
      });
    }

    return actions;
  }, [
    userCanViewTasks,
    userCanUpdateTasks,
    userCanDeleteTasks,
    navigate,
    handleEdit,
    handleDelete,
  ]);

  // Initial column visibility
  const initialColumnVisibility = {
    isVip: false, // Hide VIP column by default
    reworked: true, // Hide Reworked column by default
    startDate: true, // Hide Start Date column by default
    endDate: false, // Hide End Date column by default
    observations: false, // Hide Observations column by default
  };

  // Notify parent component about count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(filteredTasks?.length || 0);
    }
  }, [filteredTasks?.length, onCountChange]);

  // Handle filter value change from SearchableSelectField
  const handleFilterValueChange = useCallback(
    (fieldName, value) => {
      if (fieldName === "taskFilter") {
        // If clicking the same filter or clearing, deselect it
        if (selectedFilter === value || !value) {
          setSelectedFilter(null);
        } else {
          // Select the new filter
          setSelectedFilter(value);
        }
      } else if (fieldName === "departmentFilter") {
        // If clicking the same department filter or clearing, deselect it
        if (selectedDepartmentFilter === value || !value) {
          setSelectedDepartmentFilter(null);
        } else {
          // Select the new department filter
          setSelectedDepartmentFilter(value);
        }
      } else if (fieldName === "deliverableFilter") {
        // If clicking the same deliverable filter or clearing, deselect it
        if (selectedDeliverableFilter === value || !value) {
          setSelectedDeliverableFilter(null);
        } else {
          // Select the new deliverable filter
          setSelectedDeliverableFilter(value);
        }
      }
    },
    [selectedFilter, selectedDepartmentFilter, selectedDeliverableFilter]
  );

  // Create deliverables options for filter
  const deliverableFilterOptions = useMemo(() => {
    if (
      !deliverables ||
      !Array.isArray(deliverables) ||
      deliverables.length === 0
    ) {
      return [];
    }
    return deliverables.map((deliverable) => ({
      value: deliverable.name,
      label: deliverable.name,
    }));
  }, [deliverables]);

  // Create filter component for inline display (reordered: search, task filters, department, deliverables)
  const taskFilterComponent = (
    <div className="flex items-center space-x-4">
      <SearchableSelectField
        field={{
          name: "taskFilter",
          type: "select",
          label: "Task Filters",
          required: false,
          options: FILTER_OPTIONS,
          placeholder: "Search filters ",
        }}
        register={() => {}}
        errors={{}}
        setValue={handleFilterValueChange}
        watch={() => selectedFilter || ""}
        trigger={() => {}}
        clearErrors={() => {}}
        formValues={{}}
        noOptionsMessage="No filters found"
      />
      <SearchableSelectField
        field={{
          name: "departmentFilter",
          type: "select",
          label: "Department",
          required: false,
          options: FORM_OPTIONS.DEPARTMENTS,
          placeholder: "Search department ",
        }}
        register={() => {}}
        errors={{}}
        setValue={handleFilterValueChange}
        watch={() => selectedDepartmentFilter || ""}
        trigger={() => {}}
        clearErrors={() => {}}
        formValues={{}}
        noOptionsMessage="No departments found"
      />
      <SearchableSelectField
        field={{
          name: "deliverableFilter",
          type: "select",
          label: "Deliverable",
          required: false,
          options: deliverableFilterOptions,
          placeholder: "Search deliverable ",
        }}
        register={() => {}}
        errors={{}}
        setValue={handleFilterValueChange}
        watch={() => selectedDeliverableFilter || ""}
        trigger={() => {}}
        clearErrors={() => {}}
        formValues={{}}
        noOptionsMessage="No deliverables found"
      />
    </div>
  );

  return (
    <div className={`task-table  ${className}`}>
      {/* Table */}
      <TanStackTable
        ref={tableRef}
        data={filteredTasks}
        columns={taskColumns}
        tableType="tasks"
        error={error}
        isLoading={isLoading}
        onSelect={handleSelect}
        onEdit={userCanUpdateTasks ? handleEdit : null}
        onDelete={userCanDeleteTasks ? handleDelete : null}
        enableRowSelection={true}
        showBulkActions={true}
        bulkActions={bulkActions}
        initialColumnVisibility={initialColumnVisibility}
        reporters={reporters}
        users={users}
        deliverables={deliverables}
        // TanStack pagination configuration
        enablePagination={enablePagination}
        showPagination={enablePagination}
        pageSize={pageSizeState}
        // Custom filter component
        customFilter={taskFilterComponent}
        // Pass filter state for dynamic export
        customFilters={{
          selectedFilter,
          selectedDepartmentFilter,
          selectedDeliverableFilter,
          selectedUserId,
          selectedReporterId,
          selectedWeek,
        }}
      />

      {/* Edit Task Modal - managed by useTableActions */}
      {showTableEditModal && editingItem && (
        <TaskFormModal
          isOpen={showTableEditModal}
          onClose={closeEditModal}
          mode="edit"
          task={editingItem}
          monthId={selectedMonthId}
          onSuccess={handleEditSuccess}
          onError={(error) => {
            // Handle permission errors
            if (
              error?.message?.includes("permission") ||
              error?.message?.includes("User lacks required")
            ) {
              showAuthError("You do not have permission to edit tasks");
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${(() => {
          if (itemToDelete?.data_task?.taskName)
            return itemToDelete.data_task.taskName;
          if (itemToDelete?.data_task?.departments) {
            const departments = itemToDelete.data_task.departments;
            return Array.isArray(departments)
              ? departments.join(", ")
              : departments;
          }
          return itemToDelete?.data_task?.taskName || itemToDelete?.id;
        })()}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default TaskTable;
