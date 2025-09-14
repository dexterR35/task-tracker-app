import React, { useState, useEffect } from "react";
import { useAppData } from "@/hooks/useAppData";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";
import ReporterFormModal from "@/components/modals/ReporterFormModal";
import UserTable from "@/features/users/components/UserTable/UserTable";
import ReporterTable from "@/features/reporters/components/ReporterTable/ReporterTable";
import { logger } from "@/utils/logger";

const AdminManagementPage = () => {
  // Get all data directly from useAppData hook (RTK Query handles caching)
  const { monthId, monthName, users, reporters, error, isLoading } = useAppData();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reporters'
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Debug logging - only log when data changes
  useEffect(() => {
    logger.log('[AdminManagementPage] Data from RTK Query hooks:', {
      users: users?.length || 0,
      reporters: reporters?.length || 0,
      error: error?.message || null
    });
  }, [
    // Use stable IDs instead of array length for better performance
    users?.map(user => user.id).join(','),
    reporters?.map(reporter => reporter.id).join(','),
    error
  ]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center py-8 max-w-md mx-auto">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-gray-300 text-sm">
              {error?.message || "Failed to load management data. Please try refreshing the page."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const tabs = [
    {
      id: 'users',
      name: 'Users',
      count: users?.length || 0,
      description: 'Manage user accounts and permissions'
    },
    {
      id: 'reporters',
      name: 'Reporters',
      count: reporters?.length || 0,
      description: 'Manage reporter profiles and assignments'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminPageHeader 
        title="Management"
        subtitle={`${monthName} - User & Reporter Management`}
        monthId={monthId}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" text="Loading management data..." variant="spinner" />
          </div>
        )}

        {/* Main Content */}
        {!isLoading && (
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-1">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span>{tab.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {tab.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content Header */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white capitalize">
                    {activeTab === 'users' ? 'User Management' : 'Reporter Management'}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {tabs.find(tab => tab.id === activeTab)?.description}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  {/* Create Button - Only show for reporters */}
                  {activeTab === 'reporters' && (
                    <DynamicButton
                      onClick={handleCreate}
                      variant="primary"
                      size="md"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Add Reporter
                    </DynamicButton>
                  )}
                  
                  {/* Export Button */}
                  <DynamicButton
                    variant="secondary"
                    size="md"
                    className="bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    Export Data
                  </DynamicButton>
                </div>
              </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {activeTab === 'users' ? (
                <UserTable
                  users={users}
                  monthId={monthId}
                  isLoading={isLoading}
                  error={error}
                  className="rounded-xl"
                />
              ) : (
                <ReporterTable
                  reporters={reporters}
                  monthId={monthId}
                  isLoading={isLoading}
                  error={error}
                  className="rounded-xl"
                />
              )}
            </div>
          </div>
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
    </div>
  );
};

export default AdminManagementPage;
