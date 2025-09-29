import React, { useState, useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';
import { useGetSettingsTypeQuery, useUpdateSettingsTypeMutation } from '@/features/settings/settingsApi';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import ConfirmationModal from '@/components/ui/Modal/ConfirmationModal';
import TanStackTable from '@/components/Table/TanStackTable';
import { canDeleteData } from '@/features/utils/authUtils';
import { showSuccess, showError } from '@/utils/toast';
import { logger } from '@/utils/logger';
import { serializeTimestampsForRedux } from '@/utils/dateUtils';
import { prepareFormData } from '@/utils/formUtils';
import { VALIDATION_MESSAGES } from '@/components/forms/configs/sharedFormUtils';
import { TextField, NumberField, SelectField } from '@/components/forms/components';

const SettingsPage = () => {
  const { user } = useAppData();
  const [activeTab, setActiveTab] = useState('deliverables');
  const [deliverables, setDeliverables] = useState([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Check if user has permission to manage deliverables
  const canManageDeliverables = canDeleteData(user);
  
  // All users can view deliverables, but only admin with delete_data can edit
  const canViewDeliverables = true;
  
  // API hooks
  const { data: deliverablesData, isLoading: loadingSettings, error: settingsError } = useGetSettingsTypeQuery({ settingsType: 'deliverables' });
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsTypeMutation();


  // Table columns configuration
  const columns = useMemo(() => {
    const baseColumns = [];
    
    // Add selection column for all users (admin-only page)
    baseColumns.push({
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          checked={selectedDeliverables.length === deliverables.length && deliverables.length > 0}
          onChange={(e) => e.target.checked ? selectAllDeliverables() : clearSelection()}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedDeliverables.includes(row.index)}
          onChange={() => toggleDeliverableSelection(row.index)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      ),
      size: 50,
    });
    
    // Add other columns
    baseColumns.push(
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row, getValue }) => {
        const field = {
          name: `deliverable_${row.index}_name`,
          label: 'Deliverable Name',
          placeholder: 'Enter deliverable name',
          required: true
        };
        
        const register = (fieldName) => ({
          name: fieldName,
          value: getValue(),
          onChange: (e) => updateDeliverable(row.index, 'name', e.target.value)
        });
        
        const errors = {};
        
        return (
          <TextField 
            field={field}
            register={register}
            errors={errors}
            getInputType={() => 'text'}
            formValues={{}}
          />
        );
      },
    },
    {
      accessorKey: 'timePerUnit',
      header: 'Time/Unit',
      cell: ({ row, getValue }) => {
        const field = {
          name: `deliverable_${row.index}_timePerUnit`,
          label: 'Time Per Unit',
          placeholder: '0.5, 1, 1.5, 2...',
          step: 0.5,
          required: true
        };
        
        const register = (fieldName) => ({
          name: fieldName,
          value: getValue(),
          onChange: (e) => updateDeliverable(row.index, 'timePerUnit', parseFloat(e.target.value) || 0)
        });
        
        const errors = {};
        
        return (
          <NumberField 
            field={field}
            register={register}
            errors={errors}
            setValue={() => {}}
            trigger={() => {}}
            formValues={{}}
          />
        );
      },
      size: 100,
    },
    {
      accessorKey: 'timeUnit',
      header: 'Unit',
      cell: ({ row, getValue }) => {
        const field = {
          name: `deliverable_${row.index}_timeUnit`,
          label: 'Time Unit',
          placeholder: 'Select time unit',
          options: [
            { value: 'min', label: 'Min' },
            { value: 'hr', label: 'Hr' },
            { value: 'days', label: 'Days' }
          ],
          required: true
        };
        
        const register = (fieldName) => ({
          name: fieldName,
          value: getValue(),
          onChange: (e) => updateDeliverable(row.index, 'timeUnit', e.target.value)
        });
        
        const errors = {};
        
        return (
          <SelectField 
            field={field}
            register={register}
            errors={errors}
            formValues={{}}
          />
        );
      },
      size: 80,
    },
    {
      accessorKey: 'declinariTime',
      header: 'Declinari Time',
      cell: ({ row, getValue }) => {
        const field = {
          name: `deliverable_${row.index}_declinariTime`,
          label: 'Declinari Time',
          placeholder: 'Enter declinari time',
          step: 0.5,
          required: true
        };
        
        const register = (fieldName) => ({
          name: fieldName,
          value: getValue(),
          onChange: (e) => updateDeliverable(row.index, 'declinariTime', parseFloat(e.target.value) || 0)
        });
        
        const errors = {};
        
        return (
          <NumberField 
            field={field}
            register={register}
            errors={errors}
            setValue={() => {}}
            trigger={() => {}}
            formValues={{}}
          />
        );
      },
      size: 100,
    },
    {
      accessorKey: 'declinariTimeUnit',
      header: 'Declinari Unit',
      cell: ({ row, getValue }) => {
        const field = {
          name: `deliverable_${row.index}_declinariTimeUnit`,
          label: 'Declinari Time Unit',
          placeholder: 'Select declinari time unit',
          options: [
            { value: 'min', label: 'Min' },
            { value: 'hr', label: 'Hr' },
            { value: 'days', label: 'Days' }
          ],
          required: true
        };
        
        const register = (fieldName) => ({
          name: fieldName,
          value: getValue() || 'min',
          onChange: (e) => updateDeliverable(row.index, 'declinariTimeUnit', e.target.value)
        });
        
        const errors = {};
        
        return (
          <SelectField 
            field={field}
            register={register}
            errors={errors}
            formValues={{}}
          />
        );
      },
      size: 100,
    },
    {
      accessorKey: 'requiresQuantity',
      header: 'Requires Qty',
      cell: ({ row, getValue }) => {
        const isChecked = getValue();
        
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => updateDeliverable(row.index, 'requiresQuantity', e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
              disabled={!canManageDeliverables}
            />
          </div>
        );
      },
      size: 100,
    }
    );
    
    return baseColumns;
  }, [canManageDeliverables, selectedDeliverables, deliverables]);

  // Load deliverables when data is available
  React.useEffect(() => {
    if (deliverablesData?.deliverables && deliverablesData.deliverables.length > 0) {
      // Ensure all deliverables have proper default values
      const normalizedDeliverables = deliverablesData.deliverables.map(deliverable => ({
        name: deliverable.name || '',
        timePerUnit: deliverable.timePerUnit || 1,
        timeUnit: deliverable.timeUnit || 'hr',
        requiresQuantity: deliverable.requiresQuantity !== undefined ? deliverable.requiresQuantity : true, // Default to true
        declinariTime: deliverable.declinariTime || 10,
        declinariTimeUnit: deliverable.declinariTimeUnit || 'min'
      }));
      setDeliverables(normalizedDeliverables);
    } else if (!loadingSettings && !settingsError) {
      // No fallback - only load from database
      setDeliverables([]);
    }
  }, [deliverablesData, loadingSettings, settingsError]);

  // VALIDATION UTILITIES
  const validateDeliverableName = (name, index) => {
    if (!name?.trim()) {
      return 'Deliverable name is required';
    }
    if (name.trim().length < 2) {
      return 'Deliverable name must be at least 2 characters';
    }
    if (name.trim().length > 100) {
      return 'Deliverable name must be no more than 100 characters';
    }
    
    // Check for duplicates
    const existingNames = deliverables
      .map((d, i) => i !== index ? d.name?.trim().toLowerCase() : null)
      .filter(Boolean);
    
    if (existingNames.includes(name.trim().toLowerCase())) {
      return `Deliverable name "${name.trim()}" already exists`;
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

  const saveSettings = async () => {
    if (!canManageDeliverables) {
      showError('You need delete_data permission to save deliverables');
      return;
    }
    
    try {
      // VALIDATION: Use centralized validation
      const validationErrors = validateDeliverables();
      
      if (validationErrors.length > 0) {
        showError(`Validation failed: ${validationErrors.join(', ')}`);
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
      const serializedDeliverables = deliverables.map(deliverable => 
        prepareFormData({
          name: deliverable.name.trim(),
          timePerUnit: Number(deliverable.timePerUnit),
          timeUnit: deliverable.timeUnit,
          requiresQuantity: Boolean(deliverable.requiresQuantity),
          declinariTime: Number(deliverable.declinariTime),
          declinariTimeUnit: deliverable.declinariTimeUnit
        }, {
          removeEmptyFields: false,
          convertTypes: true,
          addMetadata: false
        })
      );
      
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

      await updateSettings({
        settingsType: 'deliverables',
        settingsData: serializedData,
        userData: user
      }).unwrap();
      
      showSuccess('Deliverables saved successfully!');
      logger.log('Deliverables saved to settings collection:', serializedData);
    } catch (error) {
      logger.error('Error saving deliverables:', error);
      showError('Failed to save deliverables settings');
    }
  };

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
    
    const newDeliverable = {
      name: '',
      timePerUnit: 1,
      timeUnit: 'hr',
      requiresQuantity: true,
      declinariTime: 10,
      declinariTimeUnit: 'min'
    };
    setDeliverables([...deliverables, newDeliverable]);
  };

  const updateDeliverable = (index, field, value) => {
    if (!canManageDeliverables) {
      showError('You need delete_data permission to edit deliverables');
      return;
    }
    
    
    // VALIDATION: Use centralized validation functions
    let validationError = null;
    
    if (field === 'name') {
      validationError = validateDeliverableName(value, index);
    } else if (field === 'timePerUnit') {
      validationError = validateTimePerUnit(value);
    } else if (field === 'declinariTime') {
      validationError = validateDeclinariTime(value);
    }
    
    if (validationError) {
      showError(validationError);
      return;
    }
    
    const updated = [...deliverables];
    updated[index] = { ...updated[index], [field]: value };
    setDeliverables(updated);
  };


  const toggleDeliverableSelection = (index) => {
    setSelectedDeliverables(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllDeliverables = () => {
    setSelectedDeliverables(deliverables.map((_, index) => index));
  };

  const clearSelection = () => {
    setSelectedDeliverables([]);
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

  const confirmDelete = () => {
    const updatedDeliverables = deliverables.filter((_, index) => !selectedDeliverables.includes(index));
    setDeliverables(updatedDeliverables);
    setSelectedDeliverables([]);
    setShowDeleteModal(false);
    showSuccess(`${selectedDeliverables.length} deliverable(s) deleted successfully!`);
  };

  const tabs = [
    { id: 'deliverables', label: 'Deliverables', icon: 'package' },
    { id: 'ai', label: 'AI Settings', icon: 'robot' },
    { id: 'general', label: 'General', icon: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your application settings and configurations
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {activeTab === 'deliverables' && (
            <div className="p-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Deliverables Management
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {canManageDeliverables 
                      ? "Manage your deliverables and their time settings" 
                      : "View deliverables and their time settings (read-only - need delete_data permission to edit)"
                    }
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DynamicButton
                    onClick={addDeliverable}
                    variant="primary"
                    size="sm"
                    iconName="add"
                    iconPosition="left"
                  >
                    Add New
                  </DynamicButton>
                  {selectedDeliverables.length > 0 && (
                    <DynamicButton
                      onClick={handleDeleteSelected}
                      variant="danger"
                      size="sm"
                      iconName="trash"
                      iconPosition="left"
                    >
                      Delete Selected ({selectedDeliverables.length})
                    </DynamicButton>
                  )}
                  {!canManageDeliverables && (
                    <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-800">
                      ⚠️ Read-only mode - Need delete_data permission to edit
                    </div>
                  )}
                </div>
              </div>


              {loadingSettings ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading settings...</p>
                </div>
              ) : deliverables.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Deliverables</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by adding your first deliverable</p>
                  {canManageDeliverables && (
                    <DynamicButton
                      onClick={addDeliverable}
                      variant="primary"
                      iconName="add"
                      iconPosition="left"
                    >
                      Add First Deliverable
                    </DynamicButton>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <TanStackTable
                    data={deliverables}
                    columns={columns}
                    enableRowSelection={false}
                    showActions={false}
                    showPagination={false}
                    showFilters={false}
                    showColumnToggle={false}
                    className="settings-deliverables-table"
                  />
                </div>
              )}


              {/* Save Button */}
              <div className="mt-6 flex justify-end">
                <DynamicButton
                  onClick={saveSettings}
                  variant="primary"
                  size="lg"
                  loading={saving}
                  disabled={saving}
                  iconName="save"
                  iconPosition="left"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </DynamicButton>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                AI Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                AI settings will be available soon.
              </p>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                General Settings
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                General settings will be available soon.
              </p>
            </div>
          )}
        </div>
      </div>

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

export default SettingsPage;
