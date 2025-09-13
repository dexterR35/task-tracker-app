import React from "react";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import TanStackTable from "@/components/ui/Table/TanStackTable";
import { useTableActions } from "@/hooks/useTableActions";

const UserTable = ({
  className = "",
  users = [],
  monthId,
  isLoading = false,
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
      logger.log('User view requested for:', user);
    },
    onEditSuccess: (user) => {
      showError('You don\'t have superpower for that!');
      logger.log('User edit requested for:', user);
    },
    onDeleteSuccess: (user) => {
      showError('You don\'t have superpower for that!');
      logger.log('User deletion requested for:', user);
    },
  });

  return (
    <TanStackTable
      className={className}
      data={users}
      columns={userColumns}
      tableType="users"
      isLoading={isLoading}
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
    />
  );
};

export default UserTable;