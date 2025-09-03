import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useFetchData } from "@/hooks/useFetchData.js";
import { selectCurrentMonthId, selectCurrentMonthName } from "@/features/currentMonth";
import { useDeleteReporterMutation } from "@/features/reporters";
import { useCacheManagement } from "@/hooks/useCacheManagement.js";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import DynamicTable from "@/components/ui/Table/DynamicTable";
import { getColumns } from "@/components/ui/Table/tableColumns.jsx";
import TableInfo from "@/components/ui/Table/TableInfo";
import Loader from "@/components/ui/Loader/Loader";
import { showSuccess, showError, showInfo } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import { ReporterForm } from "@/features/reporters";

const AdminManagementPage = () => {
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reporters'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReporter, setEditingReporter] = useState(null);

  // Get all data using fetch data hook (no user filter for admin management)
  const {
    users,
    reporters,
    user: currentUser, // Get user from useFetchData instead of useAuth
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
  const [deleteReporter] = useDeleteReporterMutation();
  
  // Cache management
  const { clearCacheOnDataChange } = useCacheManagement();

  // Get columns based on active tab with monthId for date formatting
  const tableColumns = getColumns(activeTab, monthId);

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
    setShowCreateModal(true);
  };

  const handleEdit = (reporter) => {
    setEditingReporter(reporter);
    setShowEditModal(true);
  };

  const handleReporterDelete = async (reporter) => {
    if (!window.confirm(`Are you sure you want to delete reporter: ${reporter.name}?`)) {
      return;
    }

    try {
      await deleteReporter(reporter.id).unwrap();
      clearCacheOnDataChange('reporters', 'delete');
      showSuccess("Reporter deleted successfully!");
    } catch (error) {
      logger.error("Reporter delete error:", error);
      showError(`Failed to delete reporter: ${error?.message || "Please try again."}`);
    }
  };

  const handleUserDelete = async (user) => {
    // TODO: Implement user deletion
    logger.log('User deletion not implemented yet');
    showInfo('User deletion not implemented yet');
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
        onDelete={activeTab === 'reporters' ? handleReporterDelete : handleUserDelete}
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

      {/* Create Reporter Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Create New Reporter
              </h2>
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
                iconName="close"
                iconPosition="center"
              />
            </div>
            <div className="p-6">
              <ReporterForm
                mode="create"
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Reporter Modal */}
      {showEditModal && editingReporter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Reporter: {editingReporter.name}
              </h2>
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReporter(null);
                }}
                iconName="close"
                iconPosition="center"
              />
            </div>
            <div className="p-6">
              <ReporterForm
                mode="edit"
                reporterId={editingReporter.id}
                initialValues={editingReporter}
              />
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AdminManagementPage;
