import React, { useState } from "react";
import DynamicTable from "@/components/ui/Table/DynamicTable.jsx";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError, showSuccess, showInfo } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import ErrorBoundary from "@/components/layout/ErrorBoundary";

const UserTable = ({
  className = "",
  users = [],
  monthId,
  isLoading = false,
  error: usersError = null,
}) => {
  const [rowActionId, setRowActionId] = useState(null);

  // Get user columns with monthId for date formatting
  const userColumns = getColumns('users', monthId);
  
  // Handle user selection - disabled with superpower message
  const handleUserSelect = (user) => {
    showError('You don\'t have superpower for that!');
    logger.log('User view requested for:', user);
  };

  // Handle user edit - disabled with superpower message
  const handleUserEdit = (user) => {
    showError('You don\'t have superpower for that!');
    logger.log('User edit requested for:', user);
  };

  // Handle user delete - disabled with superpower message
  const handleUserDelete = async (user) => {
    showError('You don\'t have superpower for that!');
    logger.log('User deletion requested for:', user);
  };

  return (
    <ErrorBoundary componentName="UserTable">
      <div className={className}>
        <DynamicTable
          data={users}
          columns={userColumns}
          tableType="users"
          onSelect={handleUserSelect}
          onEdit={handleUserEdit}
          onDelete={handleUserDelete}
          isLoading={isLoading}
          error={usersError}
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
      </div>
    </ErrorBoundary>
  );
};

export default UserTable;
