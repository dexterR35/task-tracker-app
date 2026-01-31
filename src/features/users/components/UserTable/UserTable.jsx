import React, { useMemo } from "react";
import { getColumns } from "@/components/Table/tableColumns.jsx";
import TanStackTable from "@/components/Table/TanStackTable";
import { useAllTasks } from "@/features/tasks/tasksApi";

// Helper function to get task user UID
const getTaskUserId = (task) => {
  return task?.userUID ?? task?.user?.id ?? null;
};

/**
 * Users are managed manually (no CRUD operations)
 */
const UserTable = ({
  className = "",
  users = [],
  error: usersError = null,
  isLoading: usersLoading = false,
}) => {
  // Fetch all tasks across all months for accurate overall counts
  const { tasks: allTasks = [], isLoading: tasksLoading, error: tasksError } = useAllTasks();

  // Calculate task counts per user from all tasks (overall)
  const taskCountsByUser = useMemo(() => {
    const counts = {};
    if (allTasks && Array.isArray(allTasks)) {
      allTasks.forEach(task => {
        const userId = getTaskUserId(task);
        if (userId) {
          counts[userId] = (counts[userId] || 0) + 1;
        }
      });
    }
    return counts;
  }, [allTasks]);

  // Enrich users with calculated task counts (overall)
  const enrichedUsers = useMemo(() => {
    return users.map(user => {
      const userId = user.id;
      const taskCount = taskCountsByUser[userId] || 0;

      return {
        ...user,
        taskCount: taskCount // Overall task count across all months
      };
    });
  }, [users, taskCountsByUser]);

  const userColumns = getColumns('users');
  const isLoading = usersLoading || tasksLoading;
  const error = usersError || tasksError;

  return (
    <TanStackTable
      data={enrichedUsers || []}
      columns={userColumns}
      tableType="users"
      error={error}
      className={className}
      isLoading={isLoading}
      enableRowSelection={false}
      showBulkActions={false}
      showFilters={true}
      initialColumnVisibility={{
        createdAt: false
      }}
    />
  );
};

export default UserTable;
