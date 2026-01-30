import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import TanStackTable from "@/components/Table/TanStackTable";
import { useTaskColumns } from "@/components/Table/tableColumns.jsx";
import { useTableActions } from "@/hooks/useTableActions";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import TaskFormModal from "@/features/tasks/components/TaskForm/TaskFormModal";
import { useDeleteTask, useTasks } from "@/features/tasks/tasksApi";
import { showError, showAuthError, showSuccess } from "@/utils/toast";
import { TABLE_SYSTEM } from "@/constants";
import { logger } from "@/utils/logger";
import { parseMonthId } from "@/utils/dateUtils";
import { startOfMonth, endOfMonth } from "date-fns";

// import './TaskTable.css';

const TaskTable = ({
  className = "",
  selectedMonthId = null,
  error: tasksError = null,
  isLoading: initialLoading = false,
  onCountChange = null,
  enablePagination = true,
  pageSize = 5, // Default to 5 rows for task table (other tables use TABLE_SYSTEM.DEFAULT_PAGE_SIZE)
}) => {
  // Get navigate function for React Router navigation
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Global search filter state - initialize from URL
  const [globalSearchFilter, setGlobalSearchFilter] = useState(searchParams.get("search") || "");

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

  // Get data from useAppData hook
  const {
    reporters,
    deliverables,
    user: userData,
    users,
  } = useAppDataContext();

  // Build filters object for database-level filtering
  const userUID = user?.userUID || null;
  const tasksFilters = useMemo(() => ({}), []);

  // Get tasks with database-level filtering
  const {
    tasks: dbFilteredTasks = [],
    isLoading: tasksLoading,
    error: dbTasksError,
  } = useTasks(
    selectedMonthId || null,
    isUserAdmin ? 'admin' : 'user',
    userUID,
    tasksFilters
  );

  // All filtering is done at database level - no client-side filtering needed
  const tasks = dbFilteredTasks;

  const isLoading = tasksLoading || initialLoading;
  const error = dbTasksError || tasksError;

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

  // Sort tasks by createdAt (newest first) - memoized for performance
  const filteredTasks = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }
    
    // Tasks are already filtered at database level, just sort them

    // Sort by createdAt in descending order (newest first)
    return tasks.sort((a, b) => {
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
    // Note: Other filters are handled at database level via useTasks hook
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

  // Default column visibility
  const defaultColumnVisibility = {
    isVip: false, // Hide VIP column by default
    reworked: true, // Show Reworked column by default
    startDate: true, // Show Start Date column by default
    endDate: true, // Show End Date column by default
    observations: false, // Hide Observations column by default
  };

  // Use default column visibility
  const [columnVisibility, setColumnVisibility] = useState(defaultColumnVisibility);

  // Handle column visibility changes
  const handleColumnVisibilityChange = useCallback((newVisibility) => {
    setColumnVisibility(newVisibility);
  }, []);

  // Reset to default when user changes
  useEffect(() => {
    setColumnVisibility(defaultColumnVisibility);
  }, [userUID]);

  // Use columnVisibility state as initialColumnVisibility for TanStackTable
  const initialColumnVisibility = columnVisibility;

  // Notify parent component about count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(filteredTasks?.length || 0);
    }
  }, [filteredTasks?.length, onCountChange]);

  // Sync global search filter with URL
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (globalSearchFilter !== urlSearch) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (globalSearchFilter) next.set("search", globalSearchFilter);
        else next.delete("search");
        return next;
      }, { replace: true });
    }
  }, [globalSearchFilter, searchParams, setSearchParams]);

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
        onColumnVisibilityChange={handleColumnVisibilityChange}
        reporters={reporters}
        users={users}
        deliverables={deliverables}
        // TanStack pagination configuration
        enablePagination={enablePagination}
        showPagination={enablePagination}
        pageSize={pageSizeState}
        // Global filter props for URL sync
        initialGlobalFilter={globalSearchFilter}
        onGlobalFilterChange={setGlobalSearchFilter}
        // Pass filter state for dynamic export
        customFilters={{}}
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
