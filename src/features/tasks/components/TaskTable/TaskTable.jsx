import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
import { CheckboxField } from '@/components/forms/components';
import './TaskTable.css';

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
  pageSize = 20,
}) => {
  // Filter states
  const [filters, setFilters] = useState({
    aiUsed: false,
    marketing: false,
    acquisition: false,
    product: false,
    deliverables: false
  });

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Page size state for TanStack pagination
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  
  // Table ref for clearing selection
  const tableRef = useRef(null);

  // Get auth functions separately
  const { canAccess, user } = useAuth();
  const isUserAdmin = canAccess("admin");
  
  // Get navigate function for React Router navigation
  const navigate = useNavigate();

  // Get data from useAppData hook
  const {
    tasks: contextTasks,
    reporters,
    deliverables,
    user: userData,
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
      throw new Error('Delete task mutation not available');
    }
    
    try {
      await deleteTask(
        task.monthId,  // Always use task's own monthId
        task.id,
        userData || {}  // Pass user data for permission validation
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
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions('task', {
    getItemDisplayName: (task) => {
      if (task?.data_task?.taskName) return task.data_task.taskName;
      if (task?.data_task?.departments) {
        const departments = task.data_task.departments;
        return Array.isArray(departments) ? departments.join(', ') : departments;
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
    }
  });

  // Handle edit task
  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  // Handle edit success
  const handleEditTaskSuccess = () => {
    setShowEditModal(false);
    setEditingTask(null);
    handleEditSuccess();
    // Clear table selection after edit
    tableRef.current?.clearSelection();
    // Note: Success toast is already shown by TaskForm's createFormSubmissionHandler
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Get task columns for the table
  const taskColumns = useTaskColumns(selectedMonthId, reporters, user, deliverables);

  // Page size change handler for TanStack pagination
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSizeState(newPageSize);
  }, []);


  // Extract stable user values
  const userUID = user?.userUID;
  
  // Reusable filtering function with role-based access control
  const getFilteredTasks = useCallback(
    (tasks, selectedUserId, selectedReporterId, currentMonthId, selectedWeek, activeFilters) => {
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
          const isUserTask = userUID && (
            task.userUID === userUID || 
            task.createbyUID === userUID
          );
          
          // Regular users can ONLY see their own tasks
          return isUserTask;
        }

        // If both user and reporter are selected, show tasks that match BOTH
        if (selectedUserId && selectedReporterId) {
          const matchesUser =
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId;
          
          const taskReporterId = task.data_task?.reporters;
          if (!taskReporterId) return false;
          
          // Compare task reporter ID directly with selectedReporterId (exact case)
          const matchesReporter = taskReporterId === selectedReporterId;
          
          return matchesUser && matchesReporter;
        }

        // If only user is selected, show tasks for that user
        if (selectedUserId && !selectedReporterId) {
          return (
            task.userUID === selectedUserId ||
            task.createbyUID === selectedUserId
          );
        }

        // If only reporter is selected, show tasks for that reporter
        if (selectedReporterId && !selectedUserId) {
          const taskReporterId = task.data_task?.reporters;
          if (!taskReporterId) return false;
          
          // Compare task reporter ID directly with selectedReporterId (exact case)
          return taskReporterId === selectedReporterId;
        }

        // If neither user nor reporter is selected, show tasks based on role
        if (!isUserAdmin) {
          const isUserTask = userUID && (task.userUID === userUID || task.createbyUID === userUID);
          const isReporterTask = task.reporters || task.data_task?.reporters;
          return isUserTask || isReporterTask;
        }

        return true; // Admin sees all tasks
      });

      // Apply category filters
      if (activeFilters && Object.values(activeFilters).some(filter => filter)) {
        console.log('Applying filters:', activeFilters);
        filteredTasks = filteredTasks.filter((task) => {
          const taskData = task.data_task || task;
          
          console.log('Task data:', {
            taskName: taskData.taskName,
            products: taskData.products,
            aiUsed: taskData.aiUsed,
            isVip: taskData.isVip,
            reworked: taskData.reworked
          });
          
          // AI Used filter
          if (activeFilters.aiUsed && !taskData.aiUsed?.length) {
            console.log('Filtered out - no AI used');
            return false;
          }
          
          // Marketing filter
          if (activeFilters.marketing && !taskData.products?.includes('marketing')) {
            console.log('Filtered out - not marketing');
            return false;
          }
          
          // Acquisition filter
          if (activeFilters.acquisition && !taskData.products?.includes('acquisition')) {
            console.log('Filtered out - not acquisition');
            return false;
          }
          
          // Product filter
          if (activeFilters.product && !taskData.products?.includes('product')) {
            console.log('Filtered out - not product');
            return false;
          }
          
          // Deliverables filter
          if (activeFilters.deliverables && !taskData.deliverablesUsed?.length) {
            console.log('Filtered out - no deliverables');
            return false;
          }
          
          console.log('Task passed filters');
          return true;
        });
      }

      // If a week is selected, filter by week
      if (selectedWeek && selectedWeek.days) {
        const weekTasks = [];
        selectedWeek.days.forEach(day => {
          try {
            const dayDate = day instanceof Date ? day : new Date(day);
            if (isNaN(dayDate.getTime())) return;
            
            const dayStr = dayDate.toISOString().split('T')[0];
            const dayTasks = filteredTasks.filter(task => {
              if (!task.createdAt) return false;
              
              // Handle Firestore Timestamp
              let taskDate;
              if (task.createdAt && typeof task.createdAt === 'object' && task.createdAt.seconds) {
                taskDate = new Date(task.createdAt.seconds * 1000);
              } else if (task.createdAt && typeof task.createdAt === 'object' && task.createdAt.toDate) {
                taskDate = task.createdAt.toDate();
              } else {
                taskDate = new Date(task.createdAt);
              }
              
              if (isNaN(taskDate.getTime())) return false;
              const taskDateStr = taskDate.toISOString().split('T')[0];
              return taskDateStr === dayStr;
            });
            weekTasks.push(...dayTasks);
          } catch (error) {
            console.warn('Error processing day:', error, day);
          }
        });
        filteredTasks = weekTasks;
      }

      return filteredTasks;
    },
    [isUserAdmin, userUID]
  );

  // Get filtered tasks and sort by createdAt (newest first)
  const filteredTasks = (() => {
    if (!tasks || !Array.isArray(tasks)) {
      return [];
    }
    const filtered = getFilteredTasks(
      tasks,
      selectedUserId,
      selectedReporterId,
      selectedMonthId,
      selectedWeek,
      filters
    );
    
    // Sort by createdAt in descending order (newest first)
    const sorted = filtered.sort((a, b) => {
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
      
      // Sort by timestamp (newest first)
      
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
    
    // Return sorted tasks
    
    return sorted;
  })();

  // Bulk actions - simplified without memoization
  const bulkActions = [
    {
      label: "View Selected",
      icon: "edit",
      variant: "primary",
      onClick: (selectedTasks) => {
        if (selectedTasks.length === 1) {
          const task = selectedTasks[0];
          
          // Navigate using React Router (no page reload!)
          const params = new URLSearchParams();
          if (task.monthId) params.set('monthId', task.monthId);
          if (task.createdByName) params.set('user', task.createdByName);
          
          // Use React Router navigate for smooth navigation
          navigate(`/task/${task.id}?${params.toString()}`);
        } else {
          showError("Please select only ONE task to view");
        }
      }
    },
    {
      label: "Edit Selected",
      icon: "edit",
      variant: "edit",
      onClick: (selectedTasks) => {
        if (selectedTasks.length === 1) {
          handleEditTask(selectedTasks[0]);
          // Note: Success toast will be shown by TaskForm when edit completes
        } else {
          showError("Please select only ONE task to edit");
        }
      }
    },
    {
      label: "Delete Selected",
      icon: "delete",
      variant: "danger",
      onClick: async (selectedTasks) => {
        if (selectedTasks.length === 1) {
          handleDelete(selectedTasks[0]);
        } else {
          showError("Please select only ONE task to delete");
        }
      }
    }
  ];

  // Initial column visibility
  const initialColumnVisibility = {
    'isVip': false,        // Hide VIP column by default
    'reworked': true,     // Hide Reworked column by default
    'startDate': true,    // Hide Start Date column by default
    'endDate': false,      // Hide End Date column by default
    'observations': false  // Hide Observations column by default
  };

  // Notify parent component about count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(filteredTasks?.length || 0);
    }
  }, [filteredTasks?.length, onCountChange]);


  // Handle filter changes
  const handleFilterChange = (filterName) => {
    console.log('Filter change:', filterName, 'Current filters:', filters);
    
    setFilters(prev => {
      // If the same filter is clicked, toggle it off
      if (prev[filterName]) {
        console.log('Toggling off filter:', filterName);
        return {
          aiUsed: false,
          marketing: false,
          acquisition: false,
          product: false,
          deliverables: false
        };
      }
      
      // Otherwise, select only this filter and deselect others
      console.log('Selecting only filter:', filterName);
      return {
        aiUsed: filterName === 'aiUsed',
        marketing: filterName === 'marketing',
        acquisition: filterName === 'acquisition',
        product: filterName === 'product',
        deliverables: filterName === 'deliverables'
      };
    });
  };

  return (
    <div className={`task-table ${className}`}>
      {/* Filter Checkboxes - Above table */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Filters</h3>
          </div>
          <button
            onClick={() => setFilters({
              aiUsed: false,
              marketing: false,
              acquisition: false,
              product: false,
              deliverables: false
            })}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            Clear all
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="minimal-filter-item">
            <CheckboxField
              field={{
                name: 'aiUsed',
                label: 'AI Used',
                required: false
              }}
              register={() => ({})}
              errors={{}}
              setValue={(name, value) => {
              // Force single selection by calling handleFilterChange
              handleFilterChange(name);
            }}
              trigger={() => {}}
              clearErrors={() => {}}
              formValues={filters}
            />
          </div>
          
          <div className="minimal-filter-item">
            <CheckboxField
              field={{
                name: 'marketing',
                label: 'Marketing',
                required: false
              }}
              register={() => ({})}
              errors={{}}
              setValue={(name, value) => {
              // Force single selection by calling handleFilterChange
              handleFilterChange(name);
            }}
              trigger={() => {}}
              clearErrors={() => {}}
              formValues={filters}
            />
          </div>
          
          <div className="minimal-filter-item">
            <CheckboxField
              field={{
                name: 'acquisition',
                label: 'Acquisition',
                required: false
              }}
              register={() => ({})}
              errors={{}}
              setValue={(name, value) => {
              // Force single selection by calling handleFilterChange
              handleFilterChange(name);
            }}
              trigger={() => {}}
              clearErrors={() => {}}
              formValues={filters}
            />
          </div>
          
          <div className="minimal-filter-item">
            <CheckboxField
              field={{
                name: 'product',
                label: 'Product',
                required: false
              }}
              register={() => ({})}
              errors={{}}
              setValue={(name, value) => {
              // Force single selection by calling handleFilterChange
              handleFilterChange(name);
            }}
              trigger={() => {}}
              clearErrors={() => {}}
              formValues={filters}
            />
          </div>
          
          <div className="minimal-filter-item">
            <CheckboxField
              field={{
                name: 'deliverables',
                label: 'Deliverables',
                required: false
              }}
              register={() => ({})}
              errors={{}}
              setValue={(name, value) => {
                // Force single selection by calling handleFilterChange
                handleFilterChange(name);
              }}
              trigger={() => {}}
              clearErrors={() => {}}
              formValues={filters}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <TanStackTable
        ref={tableRef}
        data={filteredTasks}
        columns={taskColumns}
        tableType="tasks"
        error={error}
        isLoading={isLoading}
        onSelect={handleSelect}
        onEdit={handleEditTask}
        onDelete={handleDelete}
        enableRowSelection={true}
        showBulkActions={true}
        bulkActions={bulkActions}
        initialColumnVisibility={initialColumnVisibility}
        reporters={reporters}
        // TanStack pagination configuration
        enablePagination={enablePagination}
        showPagination={enablePagination}
        pageSize={pageSizeState}
      />

      {/* Edit Task Modal */}
      <TaskFormModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        mode="edit"
        task={editingTask}
        monthId={selectedMonthId}
        onSuccess={handleEditTaskSuccess}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`Are you sure you want to delete task "${(() => {
          if (itemToDelete?.data_task?.taskName) return itemToDelete.data_task.taskName;
          if (itemToDelete?.data_task?.departments) {
            const departments = itemToDelete.data_task.departments;
            return Array.isArray(departments) ? departments.join(', ') : departments;
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
