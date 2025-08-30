import React, { useState, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useFetchData } from "../../shared/hooks/useFetchData";
import { useCurrentMonth } from "../../shared/hooks/useCurrentMonth";
import { useCreateReporterMutation, useUpdateReporterMutation, useDeleteReporterMutation } from "../../features/reporters/reportersApi";
import { useCacheManagement } from "../../shared/hooks/useCacheManagement";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import DynamicTable from "../../shared/components/ui/DynamicTable";
import { getColumns } from "../../shared/components/ui/tableColumns.jsx";
import TableInfo from "../../shared/components/ui/TableInfo";
import Loader from "../../shared/components/ui/Loader";
import { showSuccess, showError, showInfo } from "../../shared/utils/toast";
import { logger } from "../../shared/utils/logger";
import { sanitizeText } from "../../shared/forms/sanitization";

const AdminManagementPage = () => {
  const { monthId, monthName } = useCurrentMonth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reporters'
  const [editingItem, setEditingItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rowActionId, setRowActionId] = useState(null);

  // Get all data using fetch data hook (no user filter for admin management)
  const {
    users,
    reporters,
    user: currentUser, // Get user from useFetchData instead of useAuth
    canAccess, // Get canAccess from useFetchData instead of useAuth
    isLoading,
    error,
  } = useFetchData();

  // Helper functions for getting items by ID
  const getUserById = useMemo(() => {
    return (id) => users?.find(user => (user.userUID || user.id) === id);
  }, [users]);

  const getReporterById = useMemo(() => {
    return (id) => reporters?.find(reporter => reporter.id === id);
  }, [reporters]);

  // API hooks for reporters
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();
  const [deleteReporter] = useDeleteReporterMutation();
  
  // Cache management
  const { clearCacheOnDataChange } = useCacheManagement();

  // Get columns based on active tab
  const tableColumns = getColumns(activeTab);

  // Validation schema for reporters
  const reporterValidationSchema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    role: Yup.string()
      .required("Role is required")
      .min(1, "Role is required")
      .max(50, "Role must be less than 50 characters"),
    departament: Yup.string()
      .required("Department is required")
      .min(1, "Department is required")
      .max(50, "Department must be less than 50 characters"),
    occupation: Yup.string()
      .required("Occupation is required")
      .min(1, "Occupation is required")
      .max(100, "Occupation must be less than 100 characters"),
  });

  // Initial values for reporter form
  const reporterInitialValues = {
    name: "",
    email: "",
    role: "",
    departament: "",
    occupation: "",
  };

  // Check admin access
  if (!canAccess('admin')) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-400">You need admin permissions to access this page.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Loading management data..." 
        fullScreen={true}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Data</h2>
          <p className="text-gray-400">
            {error?.message || "Failed to load management data. Please try refreshing the page."}
          </p>
        </div>
      </div>
    );
  }

  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const itemType = activeTab === 'users' ? 'user' : 'reporter';
    const itemName = activeTab === 'users' ? item.name || item.email : item.name;
    
    if (!window.confirm(`Are you sure you want to delete this ${itemType}: ${itemName}?`)) {
      return;
    }

    try {
      if (activeTab === 'reporters') {
        await deleteReporter(item.id).unwrap();
        clearCacheOnDataChange('reporters', 'delete');
        showSuccess('Reporter deleted successfully!');
      } else {
        // TODO: Implement user deletion
        logger.log('User deletion not implemented yet');
        showInfo('User deletion not implemented yet');
      }
    } catch (error) {
      logger.error(`Error deleting ${itemType}:`, error);
      showError(`Failed to delete ${itemType}: ${error?.message || "Unknown error"}`);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setRowActionId("form");

      if (activeTab === 'reporters') {
        // Handle reporter creation/update
        if (editingItem) {
          // Update reporter
          const updates = {
            name: sanitizeText(values.name),
            email: sanitizeText(values.email),
            role: sanitizeText(values.role),
            departament: sanitizeText(values.departament),
            occupation: sanitizeText(values.occupation),
          };

          await updateReporter({ id: editingItem.id, updates }).unwrap();
          clearCacheOnDataChange('reporters', 'update');
          showSuccess('Reporter updated successfully!');
        } else {
          // Create reporter
          const reporterData = {
            name: sanitizeText(values.name),
            email: sanitizeText(values.email),
            role: sanitizeText(values.role),
            departament: sanitizeText(values.departament),
            occupation: sanitizeText(values.occupation),
            createdBy: currentUser?.uid,
            createdByName: currentUser?.name || currentUser?.email,
          };

          await createReporter(reporterData).unwrap();
          clearCacheOnDataChange('reporters', 'create');
          showSuccess('Reporter created successfully!');
        }
      } else {
        // TODO: Implement user creation/update
        logger.log('User creation/update not implemented yet');
        showInfo('User creation/update not implemented yet');
      }
      
      setShowForm(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      logger.error(`Error saving ${activeTab}:`, error);
      showError(`Failed to save: ${error?.message || "Unknown error"}`);
    } finally {
      setRowActionId(null);
      setSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Get current table data
  const tableData = activeTab === 'users' ? users : reporters;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Management</h1>
        <p className="text-gray-400">
          Manage users and reporters for {monthName || 'current month'} ({monthId})
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Users ({users?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('reporters')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reporters'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Reporters ({reporters?.length || 0})
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white capitalize">
            {activeTab} Management
          </h2>
          <p className="text-sm text-gray-400">
            {activeTab === 'users' 
              ? 'Manage user accounts and permissions (Coming Soon)'
              : 'Manage reporter assignments and roles'
            }
          </p>
        </div>
        <DynamicButton
          variant="primary"
          onClick={handleCreate}
          size="md"
          iconName="plus"
          iconPosition="left"
          disabled={activeTab === 'users'} // Disable for users until implemented
        >
          Add {activeTab.slice(0, -1)}
        </DynamicButton>
      </div>

      {/* Table Information */}
      <TableInfo 
        tableType={activeTab} 
        data={tableData || []} 
        columns={tableColumns} 
      />

      {/* Dynamic Table */}
      <DynamicTable
        data={tableData || []}
        columns={tableColumns}
        tableType={activeTab}
        onEdit={activeTab === 'reporters' ? handleEdit : null}
        onDelete={handleDelete}
        isLoading={isLoading}
        error={error}
        showPagination={true}
        showFilters={true}
        showColumnToggle={true}
        showActions={true} // You can set this to false to hide the Actions column
        pageSize={25}
        enableSorting={true}
        enableFiltering={true}
        enablePagination={true}
        enableColumnResizing={true}
        enableRowSelection={false}
      />

      {/* Reporter Form Modal */}
      {showForm && activeTab === 'reporters' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingItem ? 'Edit' : 'Add'} Reporter
            </h3>
            
            <Formik
              initialValues={editingItem ? {
                name: editingItem.name || "",
                email: editingItem.email || "",
                role: editingItem.role || "",
                departament: editingItem.departament || "",
                occupation: editingItem.occupation || "",
              } : reporterInitialValues}
              validationSchema={reporterValidationSchema}
              onSubmit={handleFormSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Name *
                    </label>
                    <Field
                      name="name"
                      id="name"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter reporter name"
                    />
                    <ErrorMessage name="name" component="div" className="text-red-400 text-xs mt-1" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email *
                    </label>
                    <Field
                      name="email"
                      id="email"
                      type="email"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-400 text-xs mt-1" />
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
                      Role *
                    </label>
                    <Field
                      name="role"
                      id="role"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter role"
                    />
                    <ErrorMessage name="role" component="div" className="text-red-400 text-xs mt-1" />
                  </div>

                  <div>
                    <label htmlFor="departament" className="block text-sm font-medium text-gray-300 mb-1">
                      Department *
                    </label>
                    <Field
                      name="departament"
                      id="departament"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter department"
                    />
                    <ErrorMessage name="departament" component="div" className="text-red-400 text-xs mt-1" />
                  </div>

                  <div>
                    <label htmlFor="occupation" className="block text-sm font-medium text-gray-300 mb-1">
                      Occupation *
                    </label>
                    <Field
                      name="occupation"
                      id="occupation"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter occupation"
                    />
                    <ErrorMessage name="occupation" component="div" className="text-red-400 text-xs mt-1" />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <DynamicButton
                      variant="outline"
                      onClick={handleFormCancel}
                      size="sm"
                      type="button"
                    >
                      Cancel
                    </DynamicButton>
                    <DynamicButton
                      variant="primary"
                      type="submit"
                      size="sm"
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      {editingItem ? 'Update' : 'Create'} Reporter
                    </DynamicButton>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* User Form Modal - Placeholder */}
      {showForm && activeTab === 'users' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              User Management
            </h3>
            <p className="text-gray-400 mb-4">
              User creation and editing functionality is coming soon...
            </p>
            <div className="flex justify-end space-x-2">
              <DynamicButton
                variant="outline"
                onClick={handleFormCancel}
                size="sm"
              >
                Close
              </DynamicButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementPage;
