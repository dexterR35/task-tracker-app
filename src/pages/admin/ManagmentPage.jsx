import React, { useState,useEffect } from "react";
import { useAppDataContext } from "@/components/layout/AuthLayout";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";
import ReporterFormModal from "@/components/modals/ReporterFormModal";
import UserTable from "@/features/users/components/UserTable/UserTable";
import ReporterTable from "@/features/reporters/components/ReporterTable/ReporterTable";

const AdminManagementPage = () => {
  // Get all data from AuthLayout context (pre-fetched data, no API calls!)
  const { monthId, monthName, users, reporters, error } = useAppDataContext();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reporters'
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Debug logging - only log when data changes
 useEffect(() => {
    console.log('[AdminManagementPage] Data from RTK Query hooks:', {
      users: users?.length || 0,
      reporters: reporters?.length || 0,
      error: error?.message || null
    });
  }, [users?.length, reporters?.length, error]);



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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Management</h1>
        <p className="text-gray-400">
          Manage users and reporters
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          <DynamicButton
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Users ({users?.length || 0})
          </DynamicButton>
          <DynamicButton
            onClick={() => setActiveTab('reporters')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'reporters'
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            Reporters ({reporters?.length || 0})
          </DynamicButton>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="capitalize">
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

      {/* Tables Rendering */}
      {activeTab === 'users' ? (
        <UserTable
          users={users}
          monthId={monthId}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <ReporterTable
          reporters={reporters}
          monthId={monthId}
          isLoading={isLoading}
          error={error}
        />
      )}

      {/* Reporter Form Modal - Only show for reporters tab */}
      {activeTab === 'reporters' && (
        <ReporterFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      )}


    </div>
  );
};

export default AdminManagementPage;
