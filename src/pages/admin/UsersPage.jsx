import React from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import UserTable from "@/features/users/components/UserTable/UserTable";

const UsersPage = () => {
  const { users, error, isLoading, canManageUsers } = useAppDataContext();
  const { user } = useAuth();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-gray-300 text-sm">
              {error?.message || "Failed to load users. Please try refreshing the page."}
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
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage user accounts and permissions
        </p>
      </div>
      <UserTable
        users={users}
        error={error}
        isLoading={isLoading}
        className="rounded-lg"
      />
    </div>
  );
};

export default UsersPage;
