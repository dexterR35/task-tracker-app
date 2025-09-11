import React, { useState } from 'react';
import DynamicButton from '../Button/DynamicButton';
import { useDeleteReporterMutation } from '@/features/reporters';
import { showError, showSuccess } from '@/utils/toast';
import { logger } from '@/utils/logger';
import ReporterFormModal from '@/components/modals/ReporterFormModal';
import { ConfirmationModal } from '@/components/ui';
import './CardsGrid.css';

const CardsGrid = ({
  className = "",
  items = [],
  type = "user", // 'user' or 'reporter'
  monthId,
  isLoading = false,
  error = null,
  children, // Function to render each card: (item) => JSX
}) => {
  const [rowActionId, setRowActionId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // API hooks for reporter CRUD (only used when type is 'reporter')
  const [deleteReporter] = useDeleteReporterMutation();

  // Handle item selection - disabled with superpower message
  const handleItemSelect = (item) => {
    showError('You don\'t have superpower for that!');
    logger.log(`${type} view requested for:`, item);
  };

  // Handle item edit
  const handleItemEdit = (item) => {
    if (type === 'reporter') {
      setEditingItem(item);
      setShowEditModal(true);
    } else {
      showError('You don\'t have superpower for that!');
      logger.log(`${type} edit requested for:`, item);
    }
  };

  // Handle item delete
  const handleItemDelete = (item) => {
    if (type === 'reporter') {
      setItemToDelete(item);
      setShowDeleteConfirm(true);
    } else {
      showError('You don\'t have superpower for that!');
      logger.log(`${type} deletion requested for:`, item);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setRowActionId(itemToDelete.id);
      if (type === 'reporter') {
        await deleteReporter(itemToDelete.id).unwrap();
        showSuccess("Reporter deleted successfully!");
      }
    } catch (error) {
      logger.error(`${type} delete error:`, error);
      showError(`Failed to delete ${type}: ${error?.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // Card rendering with all information and actions
  const renderCard = (item) => {
    const displayName = item.name || 'No Name';
    const displaySymbol = displayName.substring(0, 2).toUpperCase();
    
    // Get status based on data type and content
    const getStatus = () => {
      if (type === 'user' || item.role) {
        if (item.role === 'admin') return 'ADMIN';
        if (item.role === 'reporter') return 'REPORTER';
        return 'USER';
      }
      
      if (type === 'reporter' || item.departament) {
        if (item.departament) return item.departament.toUpperCase();
        return 'REPORTER';
      }
      
      return null;
    };
    
    // Get status color based on data
    const getStatusColor = () => {
      if (type === 'user' || item.role) {
        switch (item.role) {
          case 'admin':
            return '#ef4444'; // red
          case 'reporter':
            return '#3b82f6'; // blue
          default:
            return '#10b981'; // green
        }
      }
      
      if (type === 'reporter' || item.departament) {
        switch (item.departament?.toLowerCase()) {
          case 'engineering':
            return '#8b5cf6'; // purple
          case 'design':
            return '#f59e0b'; // amber
          case 'marketing':
            return '#06b6d4'; // cyan
          default:
            return '#10b981'; // green
        }
      }
      
      return '#10b981';
    };

    return (
      <div key={item.id} className="cards-grid__item">
        {children ? children(item, {
          displayName,
          displaySymbol,
          status: getStatus(),
          statusColor: getStatusColor(),
          onSelect: () => handleItemSelect(item),
          onEdit: () => handleItemEdit(item),
          onDelete: () => handleItemDelete(item),
          isActionLoading: rowActionId === item.id
        }) : (
          <div className="cards-grid__card">
             {/* Status Badge */}
             <div className='flex-center justify-around !important w-full flex-row-reverse px-4 py-2'>
             {getStatus() && (
                <div 
                  className="cards-grid__status" 
                  style={{ backgroundColor: getStatusColor() }}
                >
                  {getStatus()}
                </div>
              )}
                 {/* Created date */}
                 {item.createdAt && (
                  <div className="cards-grid__created">
                    Created: {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                )}
                </div>
            {/* Symbol */}
            <div className="cards-grid__symbol">{displaySymbol}</div>
            
            {/* Name */}
            <div className="cards-grid__name">{displayName}</div>
            
            {/* Content area */}
            <div className="cards-grid__content">
           
              
              {/* Details */}
              <div className="cards-grid__details">
                <div className="cards-grid__email">
                  {item.email || 'No email'}
                </div>
                
                {/* User-specific details */}
                {(type === 'user' || item.role) && item.occupation && (
                  <div className="cards-grid__occupation">
                    {item.occupation}
                  </div>
                )}
                
                {/* Reporter-specific details */}
                {(type === 'reporter' || item.departament) && item.country && (
                  <div className="cards-grid__country">
                    Country: {item.country}
                  </div>
                )}
                
             
              </div>
              
              {/* Action Buttons */}
              <div className="cards-grid__actions !flex !flex-row">
                <DynamicButton
                  variant="outline"
                  size="sm"
                  onClick={() => handleItemSelect(item)}
                  className="cards-grid__action-btn"
                >
                  View
                </DynamicButton>
                
                <DynamicButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleItemEdit(item)}
                  className="cards-grid__action-btn"
                >
                  Edit
                </DynamicButton>
                
                <DynamicButton
                  variant="danger"
                  size="sm"
                  onClick={() => handleItemDelete(item)}
                  className="cards-grid__action-btn"
                  isLoading={rowActionId === item.id}
                >
                  Delete
                </DynamicButton>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render edit modal (only for reporters)
  const renderEditModal = () => {
    if (type !== 'reporter' || !showEditModal || !editingItem) return null;
    
    return (
      <ReporterFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        mode="edit"
        reporter={editingItem}
        onSuccess={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
      />
    );
  };

  if (isLoading) {
    return (
      <div className={`${className} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="card p-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-2/3"></div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="h-8 bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-700 rounded w-16"></div>
                <div className="h-8 bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-red-400 text-lg mb-2">Error loading {type}s</div>
        <div className="text-gray-400">{error.message || `Failed to load ${type}s`}</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-gray-400 text-lg">No {type}s found</div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
        {items.map((item) => renderCard(item))}
      </div>

      {/* Edit Modal (only for reporters) */}
      {renderEditModal()}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDeleteItem}
        title={`Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        message={`Are you sure you want to delete ${type} "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </>
  );
};

export default CardsGrid;
