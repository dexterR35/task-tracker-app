import React from "react";
import { useDeleteReporterMutation } from "@/features/reporters/reportersApi";
import { getColumns } from "@/components/Table/tableColumns.jsx";
import { showError, showSuccess } from "@/utils/toast.js";
import TanStackTable from "@/components/Table/TanStackTable";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import ReporterFormModal from "@/features/reporters/components/ReporterForm/ReporterFormModal";
import { useTableActions } from "@/hooks/useTableActions";

const ReporterTable = ({
  className = "",
  reporters = [],
  error: reportersError = null,
  user = null, // User data for permission validation
  isLoading = false, // Loading state
}) => {
  // API hooks for reporter CRUD
  const [deleteReporter] = useDeleteReporterMutation();
  
  // Get reporter columns
  const reporterColumns = getColumns('reporters');
  
  
  // Custom delete mutation wrapper for reporters - simplified since useTableActions now handles permission errors
  const handleReporterDeleteMutation = async (reporter) => {
    return await deleteReporter(reporter.id, user);
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
    getItemDisplayName: (reporter) => reporter?.name,
    deleteMutation: handleReporterDeleteMutation,
    onSelectSuccess: (reporter) => {
      // Error toast is handled by useTableActions hook
    },
  });

  return (
    <div className={className}>
      <TanStackTable
        data={reporters || []}
        columns={reporterColumns}
        tableType="reporters"
        error={reportersError}
        className=""
        isLoading={isLoading}
        enableRowSelection={true}
        showBulkActions={true}
        bulkActions={[
          {
            label: "View Selected",
            icon: "edit",
            variant: "primary",
            onClick: (selectedReporters) => {
              if (selectedReporters.length === 1) {
                handleSelect(selectedReporters[0]);
              } else {
                showSuccess(`Viewing ${selectedReporters.length} selected reporters`);
              }
            }
          },
          {
            label: "Edit Selected",
            icon: "edit",
            variant: "edit",
            onClick: (selectedReporters) => {
              if (selectedReporters.length === 1) {
                handleEdit(selectedReporters[0]);
              } else {
                showSuccess(`Editing ${selectedReporters.length} selected reporters`);
              }
            }
          },
          {
            label: "Delete Selected",
            icon: "delete",
            variant: "danger",
            onClick: async (selectedReporters) => {
              if (selectedReporters.length === 1) {
                handleDelete(selectedReporters[0]);
              } else {
                try {
                  for (const reporter of selectedReporters) {
                    await handleReporterDeleteMutation(reporter);
                  }
                  showSuccess(`Deleted ${selectedReporters.length} reporters successfully!`);
                } catch (error) {
                  showError(`Failed to delete some reporters: ${error.message}`);
                }
              }
            }
          }
        ]}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
        initialColumnVisibility={{
          createdAt: false
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
          reporters={reporters}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Reporter"
        message={`Are you sure you want to delete reporter "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default ReporterTable;