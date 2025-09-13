import React from "react";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import GenericTableContainer from "@/components/ui/Table/GenericTableContainer";

const UserTable = ({
  className = "",
  users = [],
  monthId,
  isLoading = false,
  error: usersError = null,
}) => {
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
    <GenericTableContainer
      className={className}
      data={users}
      columns={userColumns}
      tableType="users"
      isLoading={isLoading}
      error={usersError}
      onSelect={handleUserSelect}
      onEdit={handleUserEdit}
      onDelete={handleUserDelete}
      // No EditModal or deleteMutation - functionality disabled
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