import React, { useState } from "react";
import DynamicTable from "./DynamicTable.jsx";
import ConfirmationModal from "../Modal/ConfirmationModal";
import { showError, showSuccess } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";

/**
 * Generic Table Container Component
 * Consolidates common table logic across TaskTable, UserTable, and ReporterTable
 * Eliminates ~200 lines of duplicate code
 */
const GenericTableContainer = ({
  // Data and configuration
  data = [],
  columns = [],
  tableType = 'generic',
  isLoading = false,
  error = null,
  className = "",
  
  // Table features
  showPagination = true,
  showFilters = true,
  showColumnToggle = true,
  pageSize = 25,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnResizing = true,
  enableRowSelection = false,
  
  // Action handlers
  onSelect = null,
  onEdit = null,
  onDelete = null,
  
  // Custom components
  EditModal = null,
  editModalProps = {},
  
  // Delete functionality
  deleteMutation = null,
  deleteItemName = 'item',
  getItemDisplayName = (item) => item?.name || item?.jiraLink || item?.email || 'Unknown',
  
  // Additional props
  ...additionalProps
}) => {
  // Shared state management
  const [rowActionId, setRowActionId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Generic item selection handler
  const handleItemSelect = (item) => {
    if (!item) return;
    
    if (onSelect) {
      onSelect(item);
    } else {
      // Default behavior - show success message
      const displayName = getItemDisplayName(item);
      showSuccess(`Selected ${deleteItemName}: ${displayName}`);
    }
  };

  // Generic item edit handler
  const handleItemEdit = (item) => {
    if (!item) return;
    
    if (onEdit) {
      onEdit(item);
    } else if (EditModal) {
      setEditingItem(item);
      setShowEditModal(true);
    } else {
      showError('Edit functionality not available for this item type');
      logger.log(`${tableType} edit requested for:`, item);
    }
  };

  // Generic item delete handler
  const handleItemDelete = (item) => {
    if (!item) return;
    
    if (onDelete) {
      onDelete(item);
    } else if (deleteMutation) {
      setItemToDelete(item);
      setShowDeleteConfirm(true);
    } else {
      showError('Delete functionality not available for this item type');
      logger.log(`${tableType} deletion requested for:`, item);
    }
  };

  // Generic delete confirmation handler
  const confirmDeleteItem = async () => {
    if (!itemToDelete || !deleteMutation) return;

    try {
      setRowActionId(itemToDelete.id);

      // Extract necessary data for deletion
      const deleteData = {
        id: itemToDelete.id,
        // Add any additional data needed for deletion
        ...(itemToDelete.monthId && { monthId: itemToDelete.monthId }),
        ...(itemToDelete.boardId && { boardId: itemToDelete.boardId }),
        ...(itemToDelete.userData && { userData: itemToDelete.userData }),
      };

      await deleteMutation(deleteData).unwrap();
      
      const displayName = getItemDisplayName(itemToDelete);
      showSuccess(`${deleteItemName} deleted successfully!`);
    } catch (error) {
      logger.error(`${tableType} delete error:`, error);
      showError(`Failed to delete ${deleteItemName}: ${error?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // Render edit modal
  const renderEditModal = () => {
    if (!showEditModal || !editingItem || !EditModal) return null;
    
    return (
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        mode="edit"
        item={editingItem}
        {...editModalProps}
      />
    );
  };

  return (
    <div className={className}>
      <DynamicTable
        data={data}
        columns={columns}
        tableType={tableType}
        onSelect={handleItemSelect}
        onEdit={handleItemEdit}
        onDelete={handleItemDelete}
        isLoading={isLoading}
        error={error}
        showPagination={showPagination}
        showFilters={showFilters}
        showColumnToggle={showColumnToggle}
        pageSize={pageSize}
        enableSorting={enableSorting}
        enableFiltering={enableFiltering}
        enablePagination={enablePagination}
        enableColumnResizing={enableColumnResizing}
        enableRowSelection={enableRowSelection}
        {...additionalProps}
      />

      {/* Edit Modal */}
      {renderEditModal()}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDeleteItem}
        title={`Delete ${deleteItemName}`}
        message={`Are you sure you want to delete ${deleteItemName} "${getItemDisplayName(itemToDelete)}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </div>
  );
};

export default GenericTableContainer;
