import React from "react";
import { getColumns } from "@/components/Table/tableColumns.jsx";
import TanStackTable from "@/components/Table/TanStackTable";

/**
 * Users are managed manually (no CRUD operations)
 */
const UserTable = ({
  className = "",
  users = [],
  error: usersError = null,
  isLoading = false,
}) => {
  const userColumns = getColumns('users');
  return (
    <TanStackTable
      data={users || []}
      columns={userColumns}
      tableType="users"
      error={usersError}
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
