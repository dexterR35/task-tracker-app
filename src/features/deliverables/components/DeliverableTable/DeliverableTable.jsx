import React, { useState, useMemo, useEffect } from "react";
import { useUpdateSettingsTypeMutation } from '@/features/settings/settingsApi';
import { useAppData } from '@/hooks/useAppData';
import { isUserAdmin } from '@/features/utils/authUtils';
import { showError, showSuccess } from '@/utils/toast';
import TanStackTable from '@/components/Table/TanStackTable';
import { SkeletonTable } from '@/components/ui/Skeleton/Skeleton';
import ConfirmationModal from '@/components/ui/Modal/ConfirmationModal';
import DeliverableFormModal from '@/features/deliverables/components/DeliverableForm/DeliverableFormModal';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { useTableActions } from '@/hooks/useTableActions';

const DeliverableTable = ({
  className = "",
  user = null,
  error: deliverablesError = null,
  isLoading = false,
  deliverables: propDeliverables = null,
  onCountChange = null,
}) => {
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Check if user has permission to manage deliverables (admin only)
  const canManageDeliverables = isUserAdmin(user);
  
  // Use prop data if provided, otherwise fallback to global data
  const { deliverables: globalDeliverables, isLoading: loadingSettings, error: settingsError } = useAppData();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsTypeMutation();
  
  // Use prop deliverables if provided, otherwise use global data
  // Show ALL deliverables including duplicates for manual cleanup
  const rawDeliverablesData = propDeliverables || globalDeliverables;
  const deliverablesData = rawDeliverablesData || [];
  

  // Notify parent component about count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(deliverablesData?.length || 0);
    }
  }, [deliverablesData?.length, onCountChange]);

  // Handle delete deliverable function
  const handleDeleteDeliverable = async (deliverable) => {
    try {
      // Simple filter by ID or by exact match if no ID
      const updatedDeliverables = deliverablesData.filter(d => {
        if (deliverable.id && d.id) {
          return d.id !== deliverable.id;
        }
        // If no IDs, match by all properties
        return !(
          d.name === deliverable.name &&
          d.department === deliverable.department &&
          d.timePerUnit === deliverable.timePerUnit &&
          d.timeUnit === deliverable.timeUnit &&
          d.variationsTime === deliverable.variationsTime &&
          d.requiresQuantity === deliverable.requiresQuantity
        );
      });
      
      await updateSettings({
        settingsType: 'deliverables',
        settingsData: {
          deliverables: updatedDeliverables
        },
        userData: user
      });
      // Note: Success toast is handled by useTableActions hook
    } catch (error) {
      showError(`Failed to delete deliverable: ${error.message}`);
    }
  };

  // Table actions hook
  const {
    handleSelect,
    handleEdit,
    handleDelete,
    showEditModal: showTableEditModal,
    showDeleteConfirm: showTableDeleteModal,
    editingItem,
    itemToDelete: deletingItem,
    closeEditModal,
    closeDeleteModal,
    confirmDelete,
  } = useTableActions('deliverable', {
    deleteMutation: handleDeleteDeliverable,
    onDeleteSuccess: () => {
    }
  });

  // Table columns - different for admin vs regular users
  const columns = useMemo(() => {
    const baseColumns = [
      {
        accessorKey: 'name',
        header: 'Deliverable Name',
        cell: ({ getValue, row }) => {
          const name = getValue();
          const department = row.original.department;
          
          // Check for duplicates within the same department only
          const isDuplicate = deliverablesData.filter(d => 
            d.name?.toLowerCase() === name?.toLowerCase() && 
            d.department === department
          ).length > 1;
          
          return (
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {name || 'N/A'}
              </span>
              {isDuplicate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Duplicate in {department}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ getValue }) => {
          const department = getValue();
          const departmentLabels = {
            'video': 'Video Production',
            'design': 'Design',
            'developer': 'Development'
          };
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {departmentLabels[department] || department || 'N/A'}
            </span>
          );
        },
        size: 140,
      }
    ];

    // Admin users see all columns including calculations and actions
    if (canManageDeliverables) {
      return [
        ...baseColumns,
        {
          accessorKey: 'timePerUnit',
          header: 'Time Per Unit',
          cell: ({ getValue }) => (
            <span className="text-gray-700 dark:text-gray-300">
              {getValue() || 0}
            </span>
          ),
          size: 100,
        },
        {
          accessorKey: 'timeUnit',
          header: 'Unit',
          cell: ({ getValue }) => (
            <span className="text-gray-700 dark:text-gray-300">
              {getValue() || 'hr'}
            </span>
          ),
          size: 80,
        },
        {
          accessorKey: 'variationsTime',
          header: 'Variations Time',
          cell: ({ getValue }) => (
            <span className="text-gray-700 dark:text-gray-300">
              {getValue() || 0} min
            </span>
          ),
          size: 120,
        },
        {
          accessorKey: 'requiresQuantity',
          header: 'Requires Quantity',
          cell: ({ getValue }) => (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              getValue() 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              {getValue() ? 'Yes' : 'No'}
            </span>
          ),
          size: 140,
        },
      ];
    }

    // Regular users only see name and count
    return baseColumns;
  }, [canManageDeliverables, handleEdit, handleDelete]);

  // Handle create deliverable
  const handleCreateDeliverable = () => {
    setShowCreateModal(true);
  };

  // Handle form success
  const handleFormSuccess = () => {
    setShowCreateModal(false);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowCreateModal(false);
  };

  // Loading state
  if (isLoading || loadingSettings) {
    return (
      <div className={`deliverable-table ${className}`}>
        <div className="mb-4">
          <SkeletonTable rows={5} />
        </div>
      </div>
    );
  }

  // Error state
  if (deliverablesError || settingsError) {
    return (
      <div className={`deliverable-table ${className}`}>
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Deliverables</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {deliverablesError?.message || settingsError?.message || 'Failed to load deliverables'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`deliverable-table ${className}`}>

      {/* Table Header */}
      <div className="flex justify-end items-center mb-4">
        {canManageDeliverables && (
          <DynamicButton
            variant="primary"
            onClick={handleCreateDeliverable}
            iconName="plus"
            iconPosition="left"
          >
            Add Deliverable
          </DynamicButton>
        )}
      </div>

      {/* Table */}
      <TanStackTable
        data={deliverablesData || []}
        columns={columns}
        tableType="deliverables"
        isLoading={isLoading}
        error={deliverablesError}
        enableRowSelection={canManageDeliverables}
        showBulkActions={canManageDeliverables}
        bulkActions={canManageDeliverables ? [
          {
            label: "View Selected",
            icon: "edit",
            variant: "primary",
            onClick: (selectedDeliverables) => {
              if (selectedDeliverables.length === 1) {
                handleSelect(selectedDeliverables[0]);
              } else {
                showSuccess(`Viewing ${selectedDeliverables.length} selected deliverables`);
              }
            }
          },
          {
            label: "Edit Selected",
            icon: "edit",
            variant: "edit",
            onClick: (selectedDeliverables) => {
              if (selectedDeliverables.length === 1) {
                handleEdit(selectedDeliverables[0]);
              } else {
                showSuccess(`Editing ${selectedDeliverables.length} selected deliverables`);
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
                // Handle bulk delete
                try {
                  for (const deliverable of selectedDeliverables) {
                    await handleDeleteDeliverable(deliverable);
                  }
                  showSuccess(`Deleted ${selectedDeliverables.length} deliverables successfully!`);
                } catch (error) {
                  showError(`Failed to delete some deliverables: ${error.message}`);
                }
              }
            }
          }
        ] : []}
        className="deliverable-table"
      />

      {/* Create Modal */}
      <DeliverableFormModal
        isOpen={showCreateModal}
        onClose={handleFormCancel}
        mode="create"
        onSuccess={handleFormSuccess}
      />

      {/* Edit Modal */}
      <DeliverableFormModal
        isOpen={showTableEditModal}
        onClose={closeEditModal}
        mode="edit"
        deliverable={editingItem}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showTableDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Delete Deliverable"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default DeliverableTable;
