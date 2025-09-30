import React from "react";
import { getColumns } from "@/components/Table/tableColumns.jsx";
import { showError } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import TanStackTable from "@/components/Table/TanStackTable";
import { useTableActions } from "@/hooks/useTableActions";

const UserTable = ({
  className = "",
  users = [],
  monthId,
  error: usersError = null,
}) => {
  // Get user columns with monthId for date formatting
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
      className={className}
      data={users}
      columns={userColumns}
      tableType="users"
      error={usersError}
      onSelect={handleSelect}
      onEdit={handleEdit}
      onDelete={handleDelete}
      showPagination={true}
      showFilters={true}
      showColumnToggle={true}
      pageSize={25}
      enableSorting={true}
      enableFiltering={true}
      enablePagination={true}
      enableColumnResizing={true}
      enableRowSelection={false}
      initialColumnVisibility={{
        createdAt: false // Hide "Created At" column by default
      }}
    />
  );
};

export default UserTable;
