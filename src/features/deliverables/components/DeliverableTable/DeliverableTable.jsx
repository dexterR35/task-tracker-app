import React, { useState, useMemo, useEffect } from "react";
import { useGetSettingsTypeQuery, useUpdateSettingsTypeMutation } from '@/features/settings/settingsApi';
import { canDeleteData } from '@/features/utils/authUtils';
import { showSuccess, showError } from '@/utils/toast';
import { serializeTimestampsForRedux } from '@/utils/dateUtils';
import { prepareFormData } from '@/utils/formUtils';
import TanStackTable from '@/components/Table/TanStackTable';
import { SkeletonTable } from '@/components/ui/Skeleton/Skeleton';
import ConfirmationModal from '@/components/ui/Modal/ConfirmationModal';
import DynamicButton from '@/components/ui/Button/DynamicButton';

const DeliverableTable = ({
  className = "",
  user = null,
  error: deliverablesError = null,
  isLoading = false,
  onCountChange = null,
}) => {
  // Settings state
  const [deliverables, setDeliverables] = useState([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  
  // Check if user has permission to manage deliverables
  const canManageDeliverables = canDeleteData(user);
  
  // API hooks for settings
  const { data: deliverablesData, isLoading: loadingSettings, error: settingsError, refetch: refetchDeliverables } = useGetSettingsTypeQuery({ settingsType: 'deliverables' });
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsTypeMutation();
  
  // Debug: Log when deliverables data changes
  useEffect(() => {
    console.log('Deliverables data changed:', deliverablesData);
  }, [deliverablesData]);

  // Notify parent component about count changes
  useEffect(() => {
    if (onCountChange) {
      onCountChange(deliverables.length);
    }
  }, [deliverables.length, onCountChange]);

  // Load deliverables when data is available
  useEffect(() => {
    // Only update if we don't have local changes or if this is the initial load
    if (deliverablesData?.deliverables && deliverablesData.deliverables.length > 0) {
      // Check if we have any local changes (new items or editing)
      const hasLocalChanges = deliverables.some(d => d.isNew || editingRow !== null);
      
      // Only update from server data if we don't have local changes
      if (!hasLocalChanges) {
        // Ensure all deliverables have proper default values
        const normalizedDeliverables = deliverablesData.deliverables.map(deliverable => ({
          name: deliverable.name || '',
          timePerUnit: deliverable.timePerUnit || 1,
          timeUnit: deliverable.timeUnit || 'hr',
          requiresQuantity: deliverable.requiresQuantity !== undefined ? deliverable.requiresQuantity : true, // Default to true
          declinariTime: deliverable.declinariTime || 10,
          declinariTimeUnit: deliverable.declinariTimeUnit || 'min',
          createdAt: deliverable.createdAt || new Date().toISOString(), // Add creation date for sorting
          updatedAt: deliverable.updatedAt || new Date().toISOString() // Add update date for sorting
        }));
        
        // Apply client-side sorting for new items (temporary sorting)
        const sortedDeliverables = normalizedDeliverables.sort((a, b) => {
          // New items (isNew: true) go to the top
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          
          // For non-new items, use API sorting (already sorted)
          // For new items, keep them at the top
          if (a.isNew && b.isNew) {
            // If both are new, sort by creation time (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          
          // For existing items, maintain API order
          return 0;
        });
        
        setDeliverables(sortedDeliverables);
      }
    } else if (!loadingSettings && !settingsError && deliverables.length === 0) {
      // Only set empty array if we don't have any local data
      setDeliverables([]);
    }
  }, [deliverablesData, loadingSettings, settingsError]);

  // VALIDATION UTILITIES
  const validateDeliverableName = (name, index) => {
    // Allow empty names for new items while typing
    if (!name?.trim()) {
      return null; // Don't show error for empty names while typing
    }
    if (name.trim().length < 2) {
      return null; // Don't show error for short names while typing
    }
    if (name.trim().length > 100) {
      return 'Deliverable name must be no more than 100 characters';
    }
    
    // Check for duplicates only when name is complete (2+ characters)
    if (name.trim().length >= 2) {
      const existingNames = deliverables
        .map((d, i) => i !== index ? d.name?.trim().toLowerCase() : null)
        .filter(Boolean);
      
      if (existingNames.includes(name.trim().toLowerCase())) {
        return `Deliverable name "${name.trim()}" already exists`;
      }
    }
    
    return null;
  };

  const validateTimePerUnit = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0.5) {
      return 'Time per unit must be at least 0.5';
    }
    if (numValue > 999) {
      return 'Time per unit must be no more than 999';
    }
    // Check if value is in 0.5 increments (0.5, 1, 1.5, 2, etc.)
    if (numValue % 0.5 !== 0) {
      return 'Time per unit must be in 0.5 increments (0.5, 1, 1.5, 2, etc.)';
    }
    return null;
  };

  const validateDeclinariTime = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      return 'Declinari time must be 0 or greater';
    }
    if (numValue > 999) {
      return 'Declinari time must be no more than 999';
    }
    return null;
  };

  // Check if a deliverable is valid (all required fields filled)
  const isDeliverableValid = (deliverable) => {
    if (!deliverable.isNew) return true; // Existing items are always valid
    
    // For new items, check required fields
    return deliverable.name?.trim() && 
           deliverable.timePerUnit > 0 && 
           deliverable.declinariTime > 0;
  };

  const validateDeliverables = () => {
    const errors = [];
    
    // Check for empty deliverables
    if (deliverables.length === 0) {
      errors.push('At least one deliverable is required');
      return errors;
    }
    
    // Validate each deliverable
    deliverables.forEach((deliverable, index) => {
      const nameError = validateDeliverableName(deliverable.name, index);
      if (nameError) {
        errors.push(`Row ${index + 1}: ${nameError}`);
      }
      
      const timeError = validateTimePerUnit(deliverable.timePerUnit);
      if (timeError) {
        errors.push(`Row ${index + 1}: ${timeError}`);
      }
      
      const declinariError = validateDeclinariTime(deliverable.declinariTime);
      if (declinariError) {
        errors.push(`Row ${index + 1}: ${declinariError}`);
      }
    });
    
    return errors;
  };

  // Table columns configuration for deliverables
  const deliverablesColumns = useMemo(() => {
    const baseColumns = [];
    
    // Add other columns
    baseColumns.push(
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row, getValue }) => {
        const isInvalid = row.original.isNew && !isDeliverableValid(row.original);
        const isEditing = editingRow === row.index || row.original.isNew;
        
        return (
          <input
            type="text"
            value={getValue() || ''}
            onChange={(e) => updateDeliverable(row.index, 'name', e.target.value)}
            disabled={!isEditing}
            readOnly={!isEditing}
            className={`form-input w-full ${isInvalid ? 'border-red-500 focus:border-red-500' : ''}`}
            placeholder="Enter deliverable name"
          />
        );
      },
    },
    {
      accessorKey: 'timePerUnit',
      header: 'Time/Unit',
      cell: ({ row, getValue }) => {
        const isInvalid = row.original.isNew && !isDeliverableValid(row.original);
        const isEditing = editingRow === row.index || row.original.isNew;
        
        return (
          <input
            type="number"
            value={getValue() || 0}
            onChange={(e) => updateDeliverable(row.index, 'timePerUnit', parseFloat(e.target.value) || 0)}
            step={0.5}
            min={0}
            disabled={!isEditing}
            readOnly={!isEditing}
            className={`form-input w-full ${isInvalid ? 'border-red-500 focus:border-red-500' : ''}`}
            placeholder="0.5, 1, 1.5, 2..."
          />
        );
      },
      size: 100,
    },
    {
      accessorKey: 'timeUnit',
      header: 'Unit',
      cell: ({ row, getValue }) => {
        const isEditing = editingRow === row.index || row.original.isNew;
        
        return (
          <select
            value={getValue() || 'hr'}
            onChange={(e) => updateDeliverable(row.index, 'timeUnit', e.target.value)}
            disabled={!isEditing}
            className="form-select w-full"
          >
            <option value="min">Min</option>
            <option value="hr">Hr</option>
            <option value="days">Days</option>
          </select>
        );
      },
      size: 80,
    },
    {
      accessorKey: 'declinariTime',
      header: 'Declinari Time',
      cell: ({ row, getValue }) => {
        const isInvalid = row.original.isNew && !isDeliverableValid(row.original);
        const isEditing = editingRow === row.index || row.original.isNew;
        
        return (
          <input
            type="number"
            value={getValue() || 0}
            onChange={(e) => updateDeliverable(row.index, 'declinariTime', parseFloat(e.target.value) || 0)}
            step={0.5}
            min={0}
            disabled={!isEditing}
            readOnly={!isEditing}
            className={`form-input w-full ${isInvalid ? 'border-red-500 focus:border-red-500' : ''}`}
            placeholder="Enter declinari time"
          />
        );
      },
      size: 100,
    },
    {
      accessorKey: 'declinariTimeUnit',
      header: 'Declinari Unit',
      cell: ({ row, getValue }) => {
        const isEditing = editingRow === row.index || row.original.isNew;
        
        return (
          <select
            value={getValue() || 'min'}
            onChange={(e) => updateDeliverable(row.index, 'declinariTimeUnit', e.target.value)}
            disabled={!isEditing}
            className="form-select w-full"
          >
            <option value="min">Min</option>
            <option value="hr">Hr</option>
            <option value="days">Days</option>
          </select>
        );
      },
      size: 100,
    },
    {
      accessorKey: 'requiresQuantity',
      header: 'Requires Qty',
      cell: ({ row, getValue }) => {
        const isChecked = getValue();
        const isEditing = editingRow === row.index || row.original.isNew;
        
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => updateDeliverable(row.index, 'requiresQuantity', e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              disabled={!canManageDeliverables || !isEditing}
            />
          </div>
        );
      },
      size: 100,
    }
    );
    
    return baseColumns;
  }, [canManageDeliverables, selectedDeliverables, deliverables, editingRow]);

  // Settings functions
  const addDeliverable = () => {
    if (!canManageDeliverables) {
      showError('You need delete_data permission to add deliverables');
      return;
    }
    
    // VALIDATION: Check for maximum deliverables limit
    if (deliverables.length >= 50) {
      showError('Maximum 50 deliverables allowed');
      return;
    }
    
    const now = new Date().toISOString();
    const newDeliverable = {
      name: '',
      timePerUnit: 1,
      timeUnit: 'hr',
      requiresQuantity: true,
      declinariTime: 10,
      declinariTimeUnit: 'min',
      createdAt: now,
      updatedAt: now,
      isNew: true // Mark as new item for temporary sorting
    };
    // Add new deliverable at the top of the list
    setDeliverables([newDeliverable, ...deliverables]);
    
    // Automatically set the new item as editable
    setEditingRow(0);
  };

  const updateDeliverable = (index, field, value) => {
    if (!canManageDeliverables) {
      showError('You need delete_data permission to edit deliverables');
      return;
    }
    
    // Sanitize input for new items
    let sanitizedValue = value;
    if (field === 'name') {
      sanitizedValue = value?.toString().trim() || '';
    } else if (field === 'timePerUnit' || field === 'declinariTime') {
      sanitizedValue = Number(value) || 0;
    }
    
    // VALIDATION: Use centralized validation functions
    let validationError = null;
    
    if (field === 'name') {
      validationError = validateDeliverableName(sanitizedValue, index);
    } else if (field === 'timePerUnit') {
      validationError = validateTimePerUnit(sanitizedValue);
    } else if (field === 'declinariTime') {
      validationError = validateDeclinariTime(sanitizedValue);
    }
    
    // Only show validation errors for complete values, not while typing
    // Allow typing in name field without validation interruption
    if (validationError && field !== 'name') {
      showError(validationError);
      return;
    }
    
    // For name field, only show errors if it's a duplicate (not length errors)
    if (validationError && field === 'name' && sanitizedValue.length >= 2) {
      // Only show error if it's a duplicate name, not length validation
      if (validationError.includes('already exists')) {
        showError(validationError);
        return;
      }
    }
    
    const updated = [...deliverables];
    updated[index] = { 
      ...updated[index], 
      [field]: sanitizedValue,
      updatedAt: new Date().toISOString() // Update timestamp when field is modified
    };
    setDeliverables(updated);
  };

  const saveSettings = async () => {
    if (!canManageDeliverables) {
      showError('You need delete_data permission to save settings');
      return;
    }
    
    try {
      // VALIDATION: Use centralized validation
      const validationErrors = validateDeliverables();
      
      if (validationErrors.length > 0) {
        showError(`Validation failed: ${validationErrors.join(', ')}`);
        return;
      }

      // Check for invalid new items
      const invalidNewItems = deliverables.filter(deliverable => 
        deliverable.isNew && !isDeliverableValid(deliverable)
      );
      
      if (invalidNewItems.length > 0) {
        showError('Please complete all required fields for new deliverables before saving');
        return;
      }
      
      // CHANGE DETECTION: Check if data actually changed
      const currentData = deliverablesData?.deliverables || [];
      
      // Normalize both datasets for proper comparison
      const normalizeForComparison = (data) => {
        return data.map(item => ({
          name: item.name || '',
          timePerUnit: Number(item.timePerUnit) || 1,
          timeUnit: item.timeUnit || 'hr',
          requiresQuantity: Boolean(item.requiresQuantity),
          declinariTime: Number(item.declinariTime) || 10,
          declinariTimeUnit: item.declinariTimeUnit || 'min'
        }));
      };
      
      const normalizedCurrent = normalizeForComparison(currentData);
      const normalizedDeliverables = normalizeForComparison(deliverables);
      
      const hasChanges = JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedDeliverables);
      
      if (!hasChanges) {
        showSuccess('No changes detected - nothing to save');
        return;
      }
      
      // SERIALIZATION: Use centralized form data preparation
      const serializedDeliverables = deliverables.map(deliverable => {
        // Remove isNew flag and prepare for saving
        const { isNew, ...deliverableData } = deliverable;
        return prepareFormData({
          name: deliverableData.name.trim(),
          timePerUnit: Number(deliverableData.timePerUnit),
          timeUnit: deliverableData.timeUnit,
          requiresQuantity: Boolean(deliverableData.requiresQuantity),
          declinariTime: Number(deliverableData.declinariTime),
          declinariTimeUnit: deliverableData.declinariTimeUnit,
          createdAt: deliverableData.createdAt,
          updatedAt: deliverableData.updatedAt
        }, {
          removeEmptyFields: false,
          convertTypes: true,
          addMetadata: false
        });
      });
      
      // Structure deliverables for settings/app/deliverables document
      const deliverablesDataToSave = {
        deliverables: serializedDeliverables,
        // Add metadata
        totalDeliverables: deliverables.length,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.name || user.email
      };

      // Serialize timestamps for Redux
      const serializedData = serializeTimestampsForRedux(deliverablesDataToSave);

      const result = await updateSettings({
        settingsType: 'deliverables',
        settingsData: serializedData,
        userData: user
      }).unwrap();
      
      // RTK Query will automatically invalidate cache and refetch data
      // No need to manually refresh - the cache will update in real-time
      showSuccess('Deliverables saved successfully!');
    } catch (error) {
      showError('Failed to save deliverables settings');
    }
  };

  const handleDeleteSelected = () => {
    if (!canManageDeliverables) {
      showError('You need delete_data permission to delete deliverables');
      return;
    }
    
    if (selectedDeliverables.length === 0) {
      showError('Please select deliverables to delete');
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const updatedDeliverables = deliverables.filter((_, index) => !selectedDeliverables.includes(index));
      
      // Prepare data for saving (remove isNew flags)
      const serializedDeliverables = updatedDeliverables.map(deliverable => {
        const { isNew, ...deliverableData } = deliverable;
        return prepareFormData({
          name: deliverableData.name.trim(),
          timePerUnit: Number(deliverableData.timePerUnit),
          timeUnit: deliverableData.timeUnit,
          requiresQuantity: Boolean(deliverableData.requiresQuantity),
          declinariTime: Number(deliverableData.declinariTime),
          declinariTimeUnit: deliverableData.declinariTimeUnit,
          createdAt: deliverableData.createdAt,
          updatedAt: deliverableData.updatedAt
        }, {
          removeEmptyFields: false,
          convertTypes: true,
          addMetadata: false
        });
      });
      
      // Structure deliverables for settings/app/deliverables document
      const deliverablesDataToSave = {
        deliverables: serializedDeliverables,
        totalDeliverables: updatedDeliverables.length,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.name || user.email
      };

      // Serialize timestamps for Redux
      const serializedData = serializeTimestampsForRedux(deliverablesDataToSave);

      console.log('Deleting deliverables, data to save:', serializedData);
      console.log('Original deliverables count:', deliverables.length);
      console.log('Updated deliverables count:', updatedDeliverables.length);
      console.log('Selected indices to delete:', selectedDeliverables);

      // Save to database using RTK Query
      const result = await updateSettings({
        settingsType: 'deliverables',
        settingsData: serializedData,
        userData: user
      }).unwrap();
      
      console.log('Delete result:', result);
      
      // Update local state immediately
      setDeliverables(updatedDeliverables);
      setSelectedDeliverables([]);
      setShowDeleteModal(false);
      
      // RTK Query will automatically invalidate cache and refetch data
      showSuccess(`${selectedDeliverables.length} deliverable(s) deleted successfully!`);
    } catch (error) {
      showError('Failed to delete deliverables');
    }
  };

  // Handle individual row edit
  const handleEditRow = (item) => {
    // Find the index of the item in the deliverables array
    const index = deliverables.findIndex(deliverable => deliverable === item);
    setEditingRow(index);
    // Store original data for change detection
    setOriginalData({ ...item });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (editingRow !== null) {
      const currentItem = deliverables[editingRow];
      
      // If it's a new item (isNew: true) and has no meaningful data, remove it
      if (currentItem.isNew && (!currentItem.name || currentItem.name.trim() === '')) {
        const updated = deliverables.filter((_, index) => index !== editingRow);
        setDeliverables(updated);
      } else if (originalData) {
        // Restore original data for existing items
        const updated = [...deliverables];
        updated[editingRow] = { ...originalData };
        setDeliverables(updated);
      }
    }
    setEditingRow(null);
    setOriginalData(null);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (editingRow === null) return;
    
    const currentData = deliverables[editingRow];
    
    // Check if data has changed
    if (originalData && JSON.stringify(currentData) === JSON.stringify(originalData)) {
      showSuccess('No changes to save');
      setEditingRow(null);
      setOriginalData(null);
      return;
    }
    
    // Validate data
    if (!isDeliverableValid(currentData)) {
      showError('Please complete all required fields before saving');
      return;
    }
    
    try {
      // Save to database
      await saveSettings();
      // Don't show success message here - saveSettings() already shows it
      setEditingRow(null);
      setOriginalData(null);
    } catch (error) {
      showError('Failed to save changes');
    }
  };

  // Handle individual row save
  const handleSaveRow = (index) => {
    if (!isDeliverableValid(deliverables[index])) {
      showError('Please complete all required fields before saving');
      return;
    }
    
    const updated = [...deliverables];
    updated[index] = { 
      ...updated[index], 
      isNew: false, // Remove isNew flag after saving
      updatedAt: new Date().toISOString()
    };
    setDeliverables(updated);
    setEditingRow(null);
    // Don't show success message here - this is just local state update
    // The actual save happens when user clicks "Save All" button
  };

  // Handle individual row delete
  const handleDeleteRow = (item) => {
    // Find the index of the item in the deliverables array
    const index = deliverables.findIndex(deliverable => deliverable === item);
    if (index !== -1) {
      setSelectedDeliverables([index]);
      setShowDeleteModal(true);
    }
  };

  // Handle row selection change
  const handleRowSelectionChange = (newSelection) => {
    setRowSelection(newSelection);
    const selectedIndices = Object.keys(newSelection).filter(key => newSelection[key]);
    setSelectedDeliverables(selectedIndices.map(Number));
  };

  return (
    <div className={className}>
      {loadingSettings ? (
        <div className="space-y-4">
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <DynamicButton
              onClick={addDeliverable}
              variant="primary"
              size="sm"
              iconName="add"
              iconPosition="left"
              disabled={!canManageDeliverables}
            >
              Add New
            </DynamicButton>
            
            {/* Save and Cancel buttons - only visible when editing */}
            {editingRow !== null && (
              <>
                <DynamicButton
                  onClick={handleSaveChanges}
                  variant="success"
                  size="sm"
                  iconName="save"
                  iconPosition="left"
                  loading={saving}
                  disabled={saving}
                >
                  Save
                </DynamicButton>
                <DynamicButton
                  onClick={handleCancelEdit}
                  variant="secondary"
                  size="sm"
                  iconName="close"
                  iconPosition="left"
                  disabled={saving}
                >
                  Cancel
                </DynamicButton>
              </>
            )}
          </div>
          
          <div className="overflow-hidden">
            <TanStackTable
              data={deliverables}
              columns={deliverablesColumns}
              enableRowSelection={false}
              showActions={true}
              showPagination={true}
              showFilters={true}
              showColumnToggle={true}
              onEdit={handleEditRow}
              onDelete={handleDeleteRow}
              className="settings-deliverables-table"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Selected Deliverables"
        message={`Are you sure you want to delete ${selectedDeliverables.length} deliverable(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default DeliverableTable;
