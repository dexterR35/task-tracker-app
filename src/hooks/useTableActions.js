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
        const departments = item.data_task.departments;
        return Array.isArray(departments) ? departments.join(', ') : departments;
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
      
      // Check if the result has an error property (RTK Query error response)
      if (result?.error) {
        const errorMessage = result.error.message || 'Unknown error';
        logger.error(`${tableType} delete error:`, result.error);
        
        // Check if it's a permission error
        const isPermissionError = errorMessage.includes('permission') || 
                                  errorMessage.includes('User lacks required') ||
                                  errorMessage.includes('You do not have permission');
        
        if (isPermissionError) {
          // Show permission error toast
          const { showAuthError } = await import('@/utils/toast');
          showAuthError(`You do not have permission to delete ${tableType}s`);
        } else {
          showError(`Failed to delete ${tableType}: ${errorMessage}`);
        }
        return; // Don't show success toast or proceed with success logic
      }
      
      // Check if the result has an unwrap method (RTK Query mutation result)
      if (result && typeof result.unwrap === 'function') {
        await result.unwrap();
      }
      
      // Only show success toast if we reach this point without errors
      const displayName = getItemDisplayName(itemToDelete);
      showSuccess(`${tableType} deleted successfully!`);
      
      if (onDeleteSuccess) {
        onDeleteSuccess(itemToDelete);
      }
    } catch (error) {
      logger.error(`${tableType} delete error:`, error);
      
      // Check if it's a permission error - if so, don't show additional error toast
      // as the permission error toast should have already been shown
      const isPermissionError = error?.message?.includes('permission') || 
                                error?.message?.includes('User lacks required') ||
                                error?.message?.includes('You do not have permission');
      
      if (!isPermissionError) {
        showError(`Failed to delete ${tableType}: ${error?.message || "Please try again."}`);
      }
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
