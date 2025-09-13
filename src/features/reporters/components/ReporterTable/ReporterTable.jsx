import React from "react";
import { useDeleteReporterMutation } from "@/features/reporters/reportersApi";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import TanStackTable from "@/components/ui/Table/TanStackTable";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import ReporterFormModal from "@/components/modals/ReporterFormModal";
import { useTableActions } from "@/hooks/useTableActions";

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
  
  // Custom delete mutation wrapper for reporters
  const handleReporterDeleteMutation = async (reporter) => {
    return await deleteReporter(reporter.id);
  };

  // Use table actions hook
  const {
    showEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    rowActionId,
    handleSelect,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeEditModal,
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions('reporter', {
    getItemDisplayName: (reporter) => reporter?.name || 'Unknown Reporter',
    deleteMutation: handleReporterDeleteMutation,
    onSelectSuccess: (reporter) => {
      showError('You don\'t have superpower for that!');
      logger.log('Reporter view requested for:', reporter);
    },
  });

  return (
    <div className={className}>
      <TanStackTable
        data={reporters}
        columns={reporterColumns}
        tableType="reporters"
        isLoading={isLoading}
        error={reportersError}
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

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <ReporterFormModal
          isOpen={showEditModal}
          onClose={closeEditModal}
          onSuccess={handleEditSuccess}
          mode="edit"
          reporter={editingItem}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Reporter"
        message={`Are you sure you want to delete reporter "${itemToDelete?.name || 'Unknown Reporter'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default ReporterTable;