import React from "react";
import { getColumns } from "@/components/Table/tableColumns.jsx";
import { showError, showSuccess } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
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
      showError('You don\'t have superpower for that!');
    },
    onEditSuccess: (user) => {
      showError('You don\'t have superpower for that!');
    },
    onDeleteSuccess: (user) => {
      showError('You don\'t have superpower for that!');
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
