import React, { useState, useEffect } from "react";
import { useAppDataContext } from "@/components/layout/AuthLayout";
import AdminPageHeader from "@/components/layout/AdminPageHeader";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";
import ReporterFormModal from "@/components/modals/ReporterFormModal";
import UserTable from "@/features/users/components/UserTable/UserTable";
import ReporterTable from "@/features/reporters/components/ReporterTable/ReporterTable";
import { logger } from "@/utils/logger";

const AdminManagementPage = () => {
  // Get all data from AuthLayout context (pre-fetched data, no API calls!)
  const { monthId, monthName, users, reporters, error, isLoading } = useAppDataContext();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reporters'
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Debug logging - only log when data changes
  useEffect(() => {
    logger.log('[AdminManagementPage] Data from RTK Query hooks:', {
      users: users?.length || 0,
      reporters: reporters?.length || 0,
      error: error?.message || null
    });
  }, [users?.length, reporters?.length, error]);

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
      icon: '👥',
      description: 'Manage user accounts and permissions',
      disabled: false
    },
    {
      id: 'reporters',
      name: 'Reporters',
      count: reporters?.length || 0,
      icon: '📊',
      description: 'Manage reporter assignments and roles',
      disabled: false
    }
  ];

  const rightContent = (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="text-white text-sm font-medium">Current Month</div>
      <div className="text-blue-200 text-lg font-semibold">{monthName}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminPageHeader
        title="Admin Management"
        subtitle="Manage users and reporters across your organization"
        icon="management"
        gradient="from-blue-900 via-purple-900 to-indigo-900"
        rightContent={rightContent}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Tab Navigation */}
        <div className="mb-8">
          <div className="bg-gray-800 rounded-xl p-2 border border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={tab.disabled}
                  className={`group relative flex items-center justify-between p-4 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{tab.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{tab.name}</div>
                      <div className="text-xs opacity-75">{tab.description}</div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}>
                    {tab.count}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          {/* Action Header */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white capitalize mb-2">
                  {activeTab} Management
                </h2>
                <p className="text-gray-400">
                  {activeTab === 'users' 
                    ? 'View and manage user accounts, roles, and permissions'
                    : 'Create, edit, and manage reporter assignments and roles'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {activeTab === 'users' && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                    <span className="text-yellow-400 text-sm font-medium">Coming Soon</span>
                  </div>
                )}
                <DynamicButton
                  variant="primary"
                  onClick={handleCreate}
                  size="md"
                  iconName="plus"
                  iconPosition="left"
                  disabled={activeTab === 'users'}
                  className="shadow-lg"
                >
                  Add {activeTab.slice(0, -1)}
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
