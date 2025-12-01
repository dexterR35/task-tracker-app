import React, { useState, useMemo, useCallback } from "react";
import { useAppDataContext } from "@/context/AppDataContext";
import { useAuth } from "@/context/AuthContext";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import ReporterFormModal from "@/features/reporters/components/ReporterForm/ReporterFormModal";
import DeliverableFormModal from "@/features/deliverables/DeliverableFormModal";
import UserTable from "@/features/users/components/UserTable/UserTable";
import ReporterTable from "@/features/reporters/components/ReporterTable/ReporterTable";
import { DeliverableTable } from "@/features/deliverables/DeliverablesManager";
import CalculationFormula from "@/components/ui/CalculationFormula/CalculationFormula";
import { CARD_SYSTEM } from "@/constants";

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
  const [showCreateReporterModal, setShowCreateReporterModal] = useState(false);
  const [showCreateDeliverableModal, setShowCreateDeliverableModal] = useState(false);
  
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

  const handleCreateReporter = () => {
    setShowCreateReporterModal(true);
  };

  const handleCreateDeliverable = () => {
    setShowCreateDeliverableModal(true);
  };

  // Tab change handler - memoized to prevent re-renders
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  // Management tabs configuration - memoized to prevent re-renders
  const allTabs = useMemo(() => [
    {
      id: 'users',
      name: 'Users',
      description: 'Manage user accounts and permissions',
      permission: canManageUsers
    },
    {
      id: 'reporters',
      name: 'Reporters',
      description: 'Manage reporter profiles and assignments',
      permission: canManageReporters
    },
    {
      id: 'deliverables',
      name: 'Deliverables',
      description: 'Manage deliverables and time settings',
      permission: canManageDeliverables
    }
  ], [canManageUsers, canManageReporters, canManageDeliverables]);
  
  // Filter tabs based on user permissions
  const tabs = useMemo(() => allTabs.filter(tab => tab.permission), [allTabs]);

  // Memoize tab button click handlers to prevent re-renders
  const tabClickHandlers = useMemo(() => {
    const handlers = {};
    tabs.forEach((tab) => {
      handlers[tab.id] = () => handleTabChange(tab.id);
    });
    return handlers;
  }, [tabs, handleTabChange]);

  // Memoize tab button styles to prevent object recreation
  const tabButtonStyles = useMemo(() => {
    const activeStyle = {
      borderBottomColor: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
      borderBottomWidth: '2px',
    };
    return { active: activeStyle, inactive: {} };
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold">
            Management
          </h1>
          <p className="text-sm ">
            {monthName} • User & Reporter Management
          </p>
        </div>
      </div>

      {/* Management Tabs */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Traditional Tab Navigation - Same style as Analytics */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex flex-wrap -mb-px space-x-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={tabClickHandlers[tab.id]}
                    className={`
                      py-3 px-4 border-b-2 font-medium text-base rounded-none
                      ${
                        isActive
                          ? "text-gray-900 dark:text-gray-100 font-semibold"
                          : "border-transparent text-gray-500 dark:text-gray-400"
                      }
                    `}
                    style={isActive ? tabButtonStyles.active : tabButtonStyles.inactive}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {/* Content Header */}
            <div className="flex items-center justify-between mb-4">
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
                    onClick={handleCreateReporter}
                    variant="primary"
                    size="sm"
                    iconName="add"
                    iconPosition="left"
                  >
                    Add Reporter
                  </DynamicButton>
                </div>
              )}
              {activeTab === 'deliverables' && canManageDeliverables(user) && (
                <div className="flex gap-2">
                  <DynamicButton
                    onClick={handleCreateDeliverable}
                    variant="primary"
                    size="sm"
                    iconName="add"
                    iconPosition="left"
                  >
                    Add Deliverable
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
                  {/* Deliverables Table */}
                  <DeliverableTable
                    user={user}
                    error={error}
                    isLoading={isLoading}
                    className="rounded-lg"
                    deliverables={deliverables}
                  />
                  
                  {/* Calculation Formula Card - At bottom */}
                  <CalculationFormula />
                </div>
              ) : (
                <div className="py-6">
                  <div className="text-center">
                    <div className="text-red-error  text-lg font-medium mb-2">
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
        </div>
      )}

      {/* Reporter Form Modal - Only show for reporters tab */}
      {activeTab === 'reporters' && canManageReporters(user) && (
        <ReporterFormModal
          isOpen={showCreateReporterModal}
          onClose={() => setShowCreateReporterModal(false)}
          mode="create"
          reporters={reporters}
          onSuccess={() => {
            setShowCreateReporterModal(false);
          }}
        />
      )}

      {/* Deliverable Form Modal - Only show for deliverables tab */}
      {activeTab === 'deliverables' && canManageDeliverables(user) && (
        <DeliverableFormModal
          isOpen={showCreateDeliverableModal}
          onClose={() => setShowCreateDeliverableModal(false)}
          mode="create"
          deliverable={null}
          onSuccess={() => {
            setShowCreateDeliverableModal(false);
          }}
          user={user}
        />
      )}
    </div>
  );
};

export default AdminManagementPage;