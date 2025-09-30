import React, { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import ReporterFormModal from "@/features/reporters/components/ReporterForm/ReporterFormModal";
import UserTable from "@/features/users/components/UserTable/UserTable";
import ReporterTable from "@/features/reporters/components/ReporterTable/ReporterTable";

const AdminManagementPage = () => {
  // Get all data directly from useAppData hook (RTK Query handles caching)
  const { monthId, monthName, users, reporters, error } = useAppData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'reporters'
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  

  // Show error state
  if (error) {
    return (
      <div className=" bg-gray-900 flex items-center justify-center">
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
  
      <div >
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {monthName} • User & Reporter Management
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Clean Tab Navigation */}
          <div className="border-b border-gray-300 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{tab.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                {activeTab === 'users' ? 'User Management' : 'Reporter Management'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </p>
            </div>
            
            {/* Action Buttons - Only show for reporters */}
            {activeTab === 'reporters' && (
              <div className="flex gap-2">
                <DynamicButton
                  onClick={handleCreate}
                  variant="primary"
                  size="sm"
                  iconName="add"
                  iconPosition="left"
                >
                  Add Reporter
                </DynamicButton>
              </div>
            )}
          </div>

          {/* Data Table Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
            {activeTab === 'users' ? (
              <UserTable
                users={users}
                monthId={monthId}
                error={error}
                className="rounded-lg"
              />
            ) : (
              <ReporterTable
                reporters={reporters}
                error={error}
                user={user}
                className="rounded-lg"
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
   
  );
};

export default AdminManagementPage;
