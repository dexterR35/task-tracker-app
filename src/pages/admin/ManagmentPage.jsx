import React, { useState } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import ReporterFormModal from "@/features/reporters/components/ReporterForm/ReporterFormModal";
import UserTable from "@/features/users/components/UserTable/UserTable";
import ReporterTable from "@/features/reporters/components/ReporterTable/ReporterTable";
import { DeliverableTable } from "@/features/deliverables/DeliverablesManager";
import CalculationFormula from "@/components/ui/CalculationFormula/CalculationFormula";

const AdminManagementPage = () => {
  // Get all data directly from context
  const { 
    monthId, 
    monthName, 
    users, 
    reporters, 
    deliverables, 
    error, 
    isLoading,
    canManageReporters,
    canManageDeliverables,
    canManageUsers
  } = useAppDataContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'reporters', 'deliverables'
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Show error state
  if (error) {
    return (
      <div className="  flex items-center justify-center ">
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

  // Filter tabs based on permissions
  const allTabs = [
    {
      id: 'users',
      name: 'Users',
      count: users?.length || 0,
      description: 'Manage user accounts and permissions',
      permission: canManageUsers
    },
    {
      id: 'reporters',
      name: 'Reporters',
      count: reporters?.length || 0,
      description: 'Manage reporter profiles and assignments',
      permission: canManageReporters
    },
    {
      id: 'deliverables',
      name: 'Deliverables',
      count: deliverables?.length || 0,
      description: 'Manage deliverables and time settings',
      permission: canManageDeliverables
    }
  ];
  
  // Filter tabs based on user permissions
  const tabs = allTabs.filter(tab => tab.permission);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            Management
          </h1>
          <p className="text-sm mt-1">
            {monthName} • User & Reporter Management
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6 min-h-screen">
        {/* Clean Tab Navigation */}
        <div className="border-bottom">
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
            <h2 className="text-lg font-medium">
              {activeTab === 'users' ? 'User Management' : 
               activeTab === 'reporters' ? 'Reporter Management' :
               activeTab === 'deliverables' ? 'Deliverables Management' : 'Management'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
          
          {/* Action Buttons */}
          {activeTab === 'reporters' && canManageReporters(user) && (
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

        {/* Content Section */}
        <div>
          {activeTab === 'users' && canManageUsers(user) ? (
            <UserTable
              users={users}
              monthId={monthId}
              error={error}
              isLoading={isLoading}
              className="rounded-lg"
            />
          ) : activeTab === 'reporters' && canManageReporters(user) ? (
            <ReporterTable
              reporters={reporters}
              error={error}
              user={user}
              isLoading={isLoading}
              className="rounded-lg"
            />
          ) : activeTab === 'deliverables' && canManageDeliverables(user) ? (
            <div className="space-y-6">
              {/* Calculation Formula Card */}
              <CalculationFormula />
              
              {/* Deliverables Table */}
              <DeliverableTable
                user={user}
                error={error}
                isLoading={isLoading}
                className="rounded-lg"
                deliverables={deliverables}
              />
            </div>
          ) : (
            <div className="py-6">
              <div className="text-center">
                <div className="text-red-500 dark:text-red-400 text-lg font-medium mb-2">
                  Access Denied
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You don't have permission to access this section.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reporter Form Modal - Only show for reporters tab */}
      {activeTab === 'reporters' && canManageReporters(user) && (
        <ReporterFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
          reporters={reporters}
          onSuccess={() => {
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default AdminManagementPage;