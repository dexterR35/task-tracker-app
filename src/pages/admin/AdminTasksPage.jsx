import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { DynamicButton, Modal, MarketsCard } from "@/components/ui";
import { TaskTable, TaskForm } from "@/features/tasks";
import { useAppData } from "@/hooks";

// Admin Tasks Page - Shows all tasks with creation form and table
const AdminTasksPage = () => {
  const { user, canAccess } = useAuth();
  const {
    users,
    reporters,
    tasks,
    isLoading,
    error,
    monthId,
    monthName,
    boardExists,
  } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTable, setShowTable] = useState(true);

  const isUserAdmin = canAccess("admin");
  const selectedUserId = searchParams.get("user") || "";

  // Get selected user name for display
  const selectedUser = users.find(
    (u) => (u.userUID || u.id) === selectedUserId
  );
  const selectedUserName =
    selectedUser?.name || selectedUser?.email || "Unknown User";
  // Handle user selection (admin only)
  const handleUserSelect = (userId) => {
    if (!userId) {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ user: userId }, { replace: true });
    }
  };

  // Filter tasks based on selected user (admin only) - optimized with useMemo
  const filteredTasks = useMemo(() => {
    if (!isUserAdmin || !selectedUserId) return tasks;

    return tasks.filter(
      (task) =>
        task.userId === selectedUserId || task.userUID === selectedUserId
    );
  }, [tasks, isUserAdmin, selectedUserId]);

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

  if (error) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        Error loading tasks: {error.message || "Unknown error"}
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className=" mx-auto px-4 py-6 text-center text-red-error">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-6">
      {/* Header */}
      <div className=" card flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h2>{title}</h2>
          <p className="text-gray-300">
            {monthId} - {monthName}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0 items-center">
          <div className="min-w-[200px]">
            <label htmlFor="selectedUser">Filter by User</label>
            <div className="flex gap-2">
              <select
                id="selectedUser"
                value={selectedUserId}
                className="flex-1 px-3 py-2"
                onChange={(e) => {
                  handleUserSelect(e.target.value);
                }}
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option
                    key={user.userUID || user.id}
                    value={user.userUID || user.id}
                  >
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              {selectedUserId && (
                <DynamicButton
                  onClick={() => handleUserSelect("")}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </DynamicButton>
              )}
            </div>
          </div>
          <DynamicButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="md"
            iconName="add"
            iconPosition="left"
            className="h-fit self-end"
            disabled={boardExists}
          >
            Create Task
          </DynamicButton>
        </div>
      </div>

      {boardExists && (
        <div className="card bg-red-error">
          <h3 className="text-lg font-semibold mb-2">
            ⚠️ Month Board Not Available
          </h3>
          <p className="text-white">
            The month board for {monthName} has not been generated yet. Task
            creation is disabled until the board is available.
          </p>
        </div>
      )}

      {/* Markets Overview Card */}
      <div className="mb-6">
        <MarketsCard tasks={filteredTasks} />
      </div>


      {/* Tasks Section */}
      <div className="bg-gray-100 dark:bg-secondary card">
        <div className="flex justify-between items-center mb-10">
          <h2 className=" text-gray-800 dark:text-white">
            {isUserAdmin && selectedUserId
              ? `${selectedUserName} Tasks`
              : "All Tasks"}
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({filteredTasks.length} tasks)
            </span>
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
            user={user}
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
          formType="task"
          mode="create"
          user={user}
          monthId={monthId}
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
