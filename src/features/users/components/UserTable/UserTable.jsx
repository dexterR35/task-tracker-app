import React from "react";
import { getColumns } from "@/components/Table/tableColumns.jsx";
import TanStackTable from "@/components/Table/TanStackTable";
import { useTableActions } from "@/hooks/useTableActions";

const UserTable = ({
  className = "",
  users = [],
  monthId,
  error: usersError = null,
  isLoading = false, // Loading state
}) => {
  // Get user columns
  const userColumns = getColumns('users', monthId);
  
  // Use table actions hook with disabled functionality
  const {
    handleSelect,
    handleEdit,
    handleDelete,
  } = useTableActions('user', {
    getItemDisplayName: (user) => user?.name || user?.email || 'Unknown User',
    onSelectSuccess: (user) => {
      // Error toast is handled by useTableActions hook
    },
    onEditSuccess: (user) => {
      // Error toast is handled by useTableActions hook
    },
    onDeleteSuccess: (user) => {
      // Error toast is handled by useTableActions hook
    },
  });

  return (
    <TanStackTable
      data={users || []}
      columns={userColumns}
      tableType="users"
      error={usersError}
      className={className}
      isLoading={isLoading}
      enableRowSelection={false}
      initialColumnVisibility={{
        createdAt: false
      }}
    />
  );
};

export default UserTable;
