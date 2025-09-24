import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { logger } from '@/utils/logger';

/**
 * Custom hook for table actions (edit, delete, select)
 * Eliminates redundant code across table components
 */
export const useTableActions = (tableType, options = {}) => {
  const navigate = useNavigate();
  const {
    onEditSuccess = null,
    onDeleteSuccess = null,
    onSelectSuccess = null,
    getItemDisplayName = (item) => {
      // Handle task structure
      if (item?.data_task?.taskName) {
        return item.data_task.taskName;
      }
      if (item?.data_task?.departments) {
        return item.data_task.departments;
      }
      // Handle other item types
      return item?.name || item?.jiraLink || item?.email || 'Unknown';
    },
    deleteMutation = null,
  } = options;

  // Modal and action state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [rowActionId, setRowActionId] = useState(null);

  // Handle item selection
  const handleSelect = (item) => {
    if (onSelectSuccess) {
      onSelectSuccess(item);
    } else if (tableType === 'task') {
      // For tasks, navigate to task detail page
      const params = new URLSearchParams();
      if (item.monthId) params.set('monthId', item.monthId);
      if (item.createdByName) params.set('user', item.createdByName);
      
      navigate(`/task/${item.id}?${params.toString()}`);
    } else {
      const displayName = getItemDisplayName(item);
      showSuccess(`Selected ${tableType}: ${displayName}`);
    }
  };

  // Handle item edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  // Handle item delete
  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  // Confirm delete item
  const confirmDelete = async () => {
    if (!itemToDelete || !deleteMutation) return;

    try {
      setRowActionId(itemToDelete.id);

      const result = await deleteMutation(itemToDelete);
      
      // Check if the result has an unwrap method (RTK Query mutation result)
      if (result && typeof result.unwrap === 'function') {
        await result.unwrap();
      }
      
      const displayName = getItemDisplayName(itemToDelete);
      showSuccess(`${tableType} deleted successfully!`);
      
      if (onDeleteSuccess) {
        onDeleteSuccess(itemToDelete);
      }
    } catch (error) {
      logger.error(`${tableType} delete error:`, error);
      showError(`Failed to delete ${tableType}: ${error?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    closeEditModal();
    if (onEditSuccess) {
      onEditSuccess(editingItem);
    }
  };

  return {
    // State
    showEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    rowActionId,
    
    // Handlers
    handleSelect,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeEditModal,
    closeDeleteModal,
    handleEditSuccess,
  };
};
