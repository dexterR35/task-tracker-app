import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { Formik } from "formik";
import { useAuth } from "@/features/auth";
import { useMonthData } from "@/hooks";
import { DynamicButton, Loader, Modal } from "@/components/ui";
import { TaskTable, TaskForm } from "@/features/tasks";
import { useAppData } from "@/hooks";
import { SelectField } from "@/features/tasks/components/TaskForm/components/TaskFormFields";
import {
  calculateTaskMetrics,
  calculateMarketMetrics,
  calculateProductMetrics,
} from "@/utils/analyticsUtils";
import { FiBarChart2, FiGlobe, FiPackage, FiClock, FiTrendingUp, FiTrendingDown } from "react-icons/fi";

// Admin Tasks Page - Shows all tasks with creation form and table
const AdminTasksPage = () => {
  // Get auth data
  const { user, canAccess } = useAuth();

  // Get month data from AppLayout context
  const { monthId, monthName, boardExists } = useMonthData();

  // Use unified hook for all app data
  const { users, reporters, tasks, isLoading, error } = useAppData();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);

  // Get auth data
  const isUserAdmin = canAccess("admin");

  // Get selected user from URL params (admin only)
  const selectedUserId = searchParams.get("user") || "";

  // Debug: log the filtering state
  console.log("AdminTasksPage Debug:", {
    selectedUserId,
    isUserAdmin,
    tasksCount: tasks?.length,
    usersCount: users?.length,
    users: users?.map((u) => ({
      id: u.id,
      userUID: u.userUID,
      name: u.name,
      email: u.email,
    })),
  });

  // Derive userId based on context: URL param > current user
  const userId = isUserAdmin ? selectedUserId : user?.uid;

  // Handle user selection (admin only) - now handled by Formik
  const handleUserSelect = (values) => {
    const userId = values.selectedUser;
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Handle create task
  const handleCreateTask = async (taskData) => {
    try {
      const result = await dispatch(
        tasksApi.endpoints.createTask.initiate({
          ...taskData,
          userId: userId || user?.uid,
          monthId: monthId,
        })
      );

      if (result.data) {
        setShowCreateModal(false);
        logger.log("Task created", { taskData, result: result.data });
      } else {
        showError("Failed to create task. Please try again.");
        logger.error("Task creation failed", { taskData, error: result.error });
      }
    } catch (error) {
      showError("An error occurred while creating the task.");
      logger.error("Task creation error", { taskData, error });
    }
  };

  // Filter tasks based on selected user (admin only)
  const filteredTasks =
    isUserAdmin && selectedUserId
      ? tasks.filter((task) => {
          // Debug: log task and selectedUserId to see the field names
          console.log("Filtering task:", {
            taskUserId: task.userId,
            taskUserUID: task.userUID,
            selectedUserId,
            task: task,
          });
          return (
            task.userId === selectedUserId || task.userUID === selectedUserId
          );
        })
      : tasks;

  // Calculate metrics for the filtered tasks
  const metrics = useMemo(() => {
    const validTasks = Array.isArray(filteredTasks) ? filteredTasks : [];
    return {
      taskMetrics: calculateTaskMetrics(validTasks),
      marketMetrics: calculateMarketMetrics(validTasks),
      productMetrics: calculateProductMetrics(validTasks),
    };
  }, [filteredTasks]);

  // Derive title based on context
  const title = (() => {
    if (isUserAdmin && selectedUserId) {
      const selectedUser = users.find(
        (u) => (u.userUID || u.id) === selectedUserId
      );
      return `All Tasks - ${selectedUser?.name || selectedUser?.email || "Unknown User"}`;
    }
    return "All Tasks - All Users";
  })();

  if (isLoading) {
    return <Loader size="xl" text="Loading tasks..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-red-400">
        Error loading tasks: {error.message || "Unknown error"}
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto px-4 py-6 text-center text-red-400">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400">
            {monthName
              ? `${monthName} - ${format(new Date(), "yyyy")}`
              : "Current Month"}
          </p>
        </div>

        {/* Admin Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
          {/* User Selection (Admin Only) */}
          {isUserAdmin && (
            <Formik
              initialValues={{ selectedUser: selectedUserId }}
              enableReinitialize={true}
            >
              {({ values, setFieldValue }) => {
                // Auto-update URL when selection changes
                useEffect(() => {
                  if (values.selectedUser !== selectedUserId) {
                    handleUserSelect(values);
                  }
                }, [values.selectedUser]);

                // Transform users to options format for SelectField
                const userOptions = users.map((user) => ({
                  value: user.userUID || user.id,
                  label: user.name || user.email,
                }));

                return (
                  <div className="min-w-[200px]">
                    <SelectField
                      name="selectedUser"
                      label="Filter by User"
                      options={userOptions}
                      placeholder="All Users"
                      helpText="Filter tasks by user"
                    />
                  </div>
                );
              }}
            </Formik>
          )}

          {/* Create Task Button */}
          <DynamicButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
            disabled={!boardExists}
          >
            Create Task
          </DynamicButton>
        </div>
      </div>

      {/* Task Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Tasks Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FiBarChart2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{metrics.taskMetrics.totalTasks}</p>
              <p className="text-sm text-gray-400">Total Tasks</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg per Task</span>
              <span className="text-white">{metrics.taskMetrics.averageHoursPerTask} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Hours</span>
              <span className="text-white">{metrics.taskMetrics.totalHours} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">AI Hours</span>
              <span className="text-white">{metrics.taskMetrics.totalAIHours} hrs</span>
            </div>
          </div>
        </div>

        {/* Total Hours Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600 rounded-lg">
              <FiClock className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{metrics.taskMetrics.totalHours}</p>
              <p className="text-sm text-gray-400">Total Hours</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Hours Tracked</span>
              <span className="text-white">{metrics.taskMetrics.totalHours} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">AI Hours</span>
              <span className="text-white">{metrics.taskMetrics.totalAIHours} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Non-AI Hours</span>
              <span className="text-white">{(metrics.taskMetrics.totalHours - metrics.taskMetrics.totalAIHours).toFixed(1)} hrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg per Task</span>
              <span className="text-white">{metrics.taskMetrics.averageHoursPerTask} hrs</span>
            </div>
          </div>
        </div>

        {/* Top 3 Markets Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600 rounded-lg">
              <FiGlobe className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{metrics.marketMetrics.totalActiveMarkets}</p>
              <p className="text-sm text-gray-400">Active Markets</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2 font-medium">Top 3 Markets:</div>
            {metrics.marketMetrics.topMarkets.slice(0, 3).map((market, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700/20 rounded px-2 py-1">
                <span className="text-sm text-gray-300">{market.market}</span>
                <span className="text-sm text-white font-medium">{market.count}</span>
              </div>
            ))}
            {metrics.marketMetrics.topMarkets.length === 0 && (
              <div className="text-sm text-gray-500">No market data available</div>
            )}
          </div>
        </div>

        {/* Top 3 Products Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600 rounded-lg">
              <FiPackage className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{metrics.productMetrics.totalActiveProducts}</p>
              <p className="text-sm text-gray-400">Active Products</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2 font-medium">Top 3 Products:</div>
            {metrics.productMetrics.topProducts.slice(0, 3).map((product, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700/20 rounded px-2 py-1">
                <span className="text-sm text-gray-300">{product.product}</span>
                <span className="text-sm text-white font-medium">{product.count}</span>
              </div>
            ))}
            {metrics.productMetrics.topProducts.length === 0 && (
              <div className="text-sm text-gray-500">No product data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Board Warning */}
      {!boardExists && (
        <div className="bg-yellow-600 text-white p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">
            ⚠️ Month Board Not Available
          </h3>
          <p>
            The month board for {monthName} has not been generated yet. Task
            creation is disabled until the board is available.
          </p>
        </div>
      )}

      {/* Tasks Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {isUserAdmin && selectedUserId ? "User Tasks" : "All Tasks"}
          </h2>
          <DynamicButton
            onClick={() => setShowTable(!showTable)}
            variant="outline"
            size="sm"
          >
            {showTable ? "Hide Table" : "Show Table"}
          </DynamicButton>
        </div>

        {showTable && (
          <TaskTable
            tasks={filteredTasks}
            users={users}
            reporters={reporters}
            monthId={monthId}
            isAdminView={isUserAdmin}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        maxWidth="max-w-4xl"
      >
        <TaskForm
          mode="create"
          reporters={reporters}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      </Modal>
    </div>
  );
};

export default AdminTasksPage;
