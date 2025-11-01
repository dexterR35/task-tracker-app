import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useDeliverablesApi } from './useDeliverablesApi';
import { isUserAdmin } from '@/features/utils/authUtils';
import { showError, showSuccess } from '@/utils/toast';
import TanStackTable from '@/components/Table/TanStackTable';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { SkeletonTable } from '@/components/ui/Skeleton/Skeleton';
import DeliverableFormModal from './DeliverableFormModal';
import { useTableActions } from '@/hooks/useTableActions';
import ConfirmationModal from '@/components/ui/Modal/ConfirmationModal';
import { TABLE_SYSTEM } from '@/constants';

// ===== CONFIGURATION =====
const CONFIG = {
  MESSAGES: {
    DELETE_SUCCESS: 'Deliverable deleted successfully!',
    DELETE_ERROR: 'Failed to delete deliverable'
  }
};

// ===== DELIVERABLE TABLE COMPONENT =====
const DeliverableTable = ({ 
  className = "", 
  user = null, 
  error = null, 
  isLoading = false, 
  deliverables: propDeliverables = null, 
  onCountChange = null 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState(null);
  const canManageDeliverables = isUserAdmin(user);
  const { deliverables: globalDeliverables, isLoading: loadingSettings, deleteDeliverable } = useDeliverablesApi();
  
  // Table ref for clearing selection
  const tableRef = useRef(null);
  

  // Real-time listener is handled by useDeliverablesApi hook

  // Use data directly from Firebase (already sorted in real-time listener)
  const deliverablesData = propDeliverables || globalDeliverables || [];

  useEffect(() => {
    if (onCountChange) onCountChange(deliverablesData?.length || 0);
  }, [deliverablesData?.length, onCountChange]);

  // Delete wrapper for useTableActions
  const handleDeleteDeliverable = async (deliverable) => {
    try {
      await deleteDeliverable(deliverable.name, user);
      // Success toast is handled by useTableActions hook
      // Real-time listener will automatically update the UI
    } catch (error) {
      showError(CONFIG.MESSAGES.DELETE_ERROR);
      throw error; // Re-throw to maintain error handling in bulk operations
    }
  };

  // Use table actions hook
  const {
    showEditModal: showTableEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    rowActionId,
    handleSelect,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions('deliverable', {
    getItemDisplayName: (deliverable) => deliverable?.name || 'Unknown Deliverable',
    deleteMutation: handleDeleteDeliverable,
    onDeleteSuccess: () => {
      // Clear table selection after delete
      tableRef.current?.clearSelection();
    },
    onSelectSuccess: () => {
      // Don't clear selection immediately for view action
    }
  });

  // Handle edit deliverable
  const handleEditDeliverable = (deliverable) => {
    setEditingDeliverable(deliverable);
    setShowCreateModal(true);
  };

  // Handle edit success
  const handleEditDeliverableSuccess = () => {
    setShowCreateModal(false);
    setEditingDeliverable(null);
    handleEditSuccess();
    // Clear table selection after edit
    tableRef.current?.clearSelection();
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setShowCreateModal(false);
    setEditingDeliverable(null);
  };

  const columns = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ getValue }) => <span className="font-medium text-gray-900 dark:text-white text-xs">{getValue()}</span>,
      size: 200,
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ getValue }) => <span className="text-gray-700 dark:text-gray-300 text-xs">{getValue()}</span>,
      size: 150,
    },
    {
      accessorKey: "timePerUnit",
      header: "Time Per Unit",
      cell: ({ getValue, row }) => <span className="text-gray-700 dark:text-gray-300 text-xs">{getValue()} {row.original.timeUnit}</span>,
      size: 120,
    },
    {
      accessorKey: "variationsTime",
      header: "Variations Time",
      cell: ({ getValue, row }) => <span className="text-gray-700 dark:text-gray-300 text-xs">{getValue() > 0 ? `${getValue()} ${row.original.variationsTimeUnit || 'min'}` : 'None'}</span>,
      size: 120,
    },
    {
      accessorKey: "requiresQuantity",
      header: "Requires Quantity",
      cell: ({ getValue }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          getValue() ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
      size: 120,
    },
  ], []);

  // Memoized bulk actions
  const bulkActions = useMemo(() => [
    {
      label: "Edit Selected",
      icon: "edit",
      variant: "edit",
      onClick: (selectedDeliverables) => {
        if (selectedDeliverables.length === 1) {
          handleEditDeliverable(selectedDeliverables[0]);
        } else {
          showError("Please select only ONE deliverable to edit");
        }
      }
    },
    {
      label: "Delete Selected",
      icon: "delete",
      variant: "danger",
      onClick: async (selectedDeliverables) => {
        if (selectedDeliverables.length === 1) {
          handleDelete(selectedDeliverables[0]);
        } else {
          showError("Please select only ONE deliverable to delete");
        }
      }
    }
  ], [handleEditDeliverable, handleDelete]);

  if (isLoading || loadingSettings) return <SkeletonTable className={className} />;

  return (
    <div className={`deliverable-table ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Deliverables Management ({deliverablesData.length} items)
        </h3>
        {canManageDeliverables && (
          <DynamicButton onClick={() => setShowCreateModal(true)} iconName="add" variant="primary">
            Add Deliverable
          </DynamicButton>
        )}
      </div>

      {/* Info message when no deliverables */}
      {deliverablesData.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            No deliverables found. Click "Add Deliverable" to create your first deliverable.
          </p>
        </div>
      )}

      <TanStackTable
        ref={tableRef}
        data={deliverablesData}
        columns={columns}
        tableType="deliverables"
        isLoading={isLoading}
        onSelect={handleSelect}
        onEdit={handleEditDeliverable}
        onDelete={handleDelete}
        enableRowSelection={canManageDeliverables}
        showBulkActions={canManageDeliverables}
        bulkActions={bulkActions}
        showFilters={true}
        showPagination={true}
        showColumnToggle={true}
        enablePagination={true}
        enableFiltering={true}
        pageSize={TABLE_SYSTEM.DEFAULT_PAGE_SIZE}
      />

      {/* Edit Deliverable Modal */}
      <DeliverableFormModal
        isOpen={showCreateModal}
        onClose={handleEditModalClose}
        mode={editingDeliverable ? 'edit' : 'create'}
        deliverable={editingDeliverable}
        onSuccess={handleEditDeliverableSuccess}
        user={user}  // Pass user prop
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Deliverable"
        message={`Are you sure you want to delete "${itemToDelete?.name || 'this deliverable'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default DeliverableTable;
