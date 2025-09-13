import React from "react";
import { useDeleteReporterMutation } from "@/features/reporters/reportersApi";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import GenericTableContainer from "@/components/ui/Table/GenericTableContainer";
import ReporterFormModal from "@/components/modals/ReporterFormModal";

const ReporterTable = ({
  className = "",
  reporters = [],
  monthId,
  isLoading = false,
  error: reportersError = null,
}) => {
  // API hooks for reporter CRUD
  const [deleteReporter] = useDeleteReporterMutation();
  
  // Get reporter columns with monthId for date formatting
  const reporterColumns = getColumns('reporters', monthId);
  
  // Handle reporter selection - disabled with superpower message
  const handleReporterSelect = (reporter) => {
    showError('You don\'t have superpower for that!');
    logger.log('Reporter view requested for:', reporter);
  };

  // Custom delete mutation wrapper for reporters
  const handleReporterDelete = async (deleteData) => {
    const { id } = deleteData;
    return await deleteReporter(id);
  };

  return (
    <GenericTableContainer
      className={className}
      data={reporters}
      columns={reporterColumns}
      tableType="reporters"
      isLoading={isLoading}
      error={reportersError}
      onSelect={handleReporterSelect}
      EditModal={ReporterFormModal}
      editModalProps={{
        mode: "edit"
      }}
      deleteMutation={handleReporterDelete}
      deleteItemName="reporter"
      getItemDisplayName={(reporter) => reporter?.name || 'Unknown Reporter'}
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

export default ReporterTable;