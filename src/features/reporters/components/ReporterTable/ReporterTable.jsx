import React, { useState } from "react";
import { useDeleteReporterMutation } from "@/features/reporters";
import { DynamicButton } from "@/components";
import DynamicTable from "@/components/ui/Table/DynamicTable.jsx";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import { showError, showSuccess } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import ReporterFormModal from "@/components/modals/ReporterFormModal";
import { ConfirmationModal } from "@/components/ui";

const ReporterTable = ({
  className = "",
  reporters = [],
  monthId,
  isLoading = false,
  error: reportersError = null,
}) => {
  const [rowActionId, setRowActionId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReporter, setEditingReporter] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reporterToDelete, setReporterToDelete] = useState(null);

  // API hooks for reporter CRUD
  const [deleteReporter] = useDeleteReporterMutation();
  
  // Get reporter columns with monthId for date formatting
  const reporterColumns = getColumns('reporters', monthId);
  
  // Handle reporter selection - disabled with superpower message
  const handleReporterSelect = (reporter) => {
    showError('You don\'t have superpower for that!');
    logger.log('Reporter view requested for:', reporter);
  };

  // Handle reporter edit - open modal with ReporterForm
  const handleReporterEdit = (reporter) => {
    setEditingReporter(reporter);
    setShowEditModal(true);
  };

  // Handle reporter delete
  const handleReporterDelete = (reporter) => {
    setReporterToDelete(reporter);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteReporter = async () => {
    if (!reporterToDelete) return;

    try {
      setRowActionId(reporterToDelete.id);
      await deleteReporter(reporterToDelete.id).unwrap();
      showSuccess("Reporter deleted successfully!");
    } catch (error) {
      logger.error("Reporter delete error:", error);
      showError(`Failed to delete reporter: ${error?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
      setReporterToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // Render edit modal
  const renderEditModal = () => {
    if (!showEditModal || !editingReporter) return null;
    
    return (
      <ReporterFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingReporter(null);
        }}
        mode="edit"
        reporter={editingReporter}
        onSuccess={() => {
          setShowEditModal(false);
          setEditingReporter(null);
          showSuccess("Reporter updated successfully!");
        }}
      />
    );
  };

  return (
    <div className={className}>
      <DynamicTable
        data={reporters}
        columns={reporterColumns}
        tableType="reporters"
        onSelect={handleReporterSelect}
        onEdit={handleReporterEdit}
        onDelete={handleReporterDelete}
        isLoading={isLoading}
        error={reportersError}
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

      {/* Edit Reporter Modal */}
      {renderEditModal()}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setReporterToDelete(null);
        }}
        onConfirm={confirmDeleteReporter}
        title="Delete Reporter"
        message={`Are you sure you want to delete reporter "${reporterToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === reporterToDelete?.id}
      />
    </div>
  );
};

export default ReporterTable;
