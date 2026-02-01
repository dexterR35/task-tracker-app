import React, { useMemo } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { getUserColumns } from "@/components/Table/tableColumns.jsx";
import TanStackTable from "@/components/Table/TanStackTable";
const UsersPage = () => {
  const { users, error, isLoading, canManageUsers, user } = useAppDataContext();

  const enrichedUsers = useMemo(
    () => (users || []).map((u) => ({ ...u, taskCount: 0 })),
    [users]
  );

  const userColumns = getUserColumns();
  const tableLoading = isLoading;
  const tableError = error;

  if (tableError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-gray-300 text-sm">
              {tableError?.message || "Failed to load users. Please try refreshing the page."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!canManageUsers(user)) {
    return (
      <div className="py-6">
        <div className="text-center">
          <div className="text-red-500 dark:text-red-400 text-lg font-medium mb-2">
            Access Denied
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage user accounts and permissions
        </p>
      </div>
      <TanStackTable
        data={enrichedUsers}
        columns={userColumns}
        error={tableError}
        className="rounded-lg"
        isLoading={tableLoading}
        showFilters={true}
        initialColumnVisibility={{ createdAt: false }}
      />
    </div>
  );
};

export default UsersPage;
