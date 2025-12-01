import React, { useMemo } from 'react';
import TanStackTable from '@/components/Table/TanStackTable';
import { getColumns } from '@/components/Table/tableColumns';
import { useTeamDaysOff } from '@/features/teamDaysOff/teamDaysOffApi';
import { useAppDataContext } from '@/context/AppDataContext';
import { useUsers } from '@/features/users/usersApi';
import { useTableActions } from '@/hooks/useTableActions';
import TeamDaysOffFormModal from '@/features/teamDaysOff/components/TeamDaysOffFormModal';
import DaysOffCalendar from '@/features/teamDaysOff/components/DaysOffCalendar';
import ConfirmationModal from '@/components/ui/Modal/ConfirmationModal';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/icons';

/**
 * Team Days Off Page
 * Displays a table with all users and their holiday/days off information
 */
const TeamDaysOffPage = () => {
  const { user: authUser } = useAuth();
  const { teamDaysOff, isLoading: teamDaysOffLoading, error, createTeamDaysOff, updateTeamDaysOff, deleteTeamDaysOff } = useTeamDaysOff();
  
  // Get users from context or API
  const appData = useAppDataContext();
  const { users: contextUsers = [] } = appData || {};
  const { users: apiUsers = [], isLoading: usersLoading } = useUsers();
  const allUsers = contextUsers.length > 0 ? contextUsers : apiUsers;
  const isLoading = teamDaysOffLoading || usersLoading;
  
  // Merge users with teamDaysOff data
  const tableData = useMemo(() => {
    // Create a map of userUID -> teamDaysOff entry
    const daysOffMap = new Map();
    teamDaysOff.forEach(entry => {
      const userUID = entry.userUID || entry.userId; // Support both for backward compatibility
      if (userUID) {
        daysOffMap.set(userUID, entry);
      }
    });
    
    // Merge all users with their days off data
    return allUsers.map(user => {
      const userUID = user.userUID || user.id;
      const daysOffEntry = daysOffMap.get(userUID);
      
      if (daysOffEntry) {
        // User has an entry - use pre-calculated values from API hook
        // API hook already calculates daysTotal, daysRemaining, monthlyAccrual, etc.
        // No need to recalculate here - prevents duplicate calculations and ensures consistency
        return {
          id: daysOffEntry.id,
          userUID: userUID,
          userName: user.name || user.email || 'Unknown',
          baseDays: daysOffEntry.baseDays || 0,
          daysOff: daysOffEntry.daysOff || 0,
          daysTotal: daysOffEntry.daysTotal || 0,
          daysRemaining: daysOffEntry.daysRemaining || 0,
          monthsAccrued: daysOffEntry.monthsAccrued || 0,
          monthlyAccrual: daysOffEntry.monthlyAccrual || 0,
          offDays: daysOffEntry.offDays || [],
          hasEntry: true,
        };
      } else {
        // User doesn't have an entry yet, show default values (no months accrued until entry is created)
        const monthsAccrued = 0;
        const monthlyAccrual = 0;
        const daysTotal = 0; // Default: 0 base days, no accrual until entry is created
        
        return {
          id: null,
          userUID: userUID,
          userName: user.name || user.email || 'Unknown',
          baseDays: 0,
          daysOff: 0,
          daysTotal: daysTotal,
          daysRemaining: daysTotal,
          monthsAccrued: monthsAccrued,
          monthlyAccrual: monthlyAccrual,
          hasEntry: false,
        };
      }
    });
  }, [allUsers, teamDaysOff]);
  
  const {
    showEditModal,
    editingItem,
    showDeleteConfirm,
    itemToDelete,
    handleEdit,
    handleDelete,
    confirmDelete,
    closeEditModal,
    closeDeleteModal,
    handleEditSuccess,
  } = useTableActions('teamDaysOff', {
    getItemDisplayName: (item) => item?.userName || 'Unknown User',
    deleteMutation: null, // Disable delete functionality
  });

  // Get table columns from tableColumns.jsx
  const columns = useMemo(() => getColumns('teamDaysOff'), []);

  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
  };

  return (
    <div className="team-days-off-page p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Team Days Off
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage holiday days and time off for team members
          </p>
        </div>
        {authUser?.role === 'admin' && (
          <DynamicButton
            variant="primary"
             size="md"
            onClick={() => setShowCreateModal(true)}
            icon={Icons.buttons.add}
          >
            Add Entry
          </DynamicButton>
        )}
      </div>

      {/* Calendar */}
      <DaysOffCalendar teamDaysOff={teamDaysOff || []} />

      {/* Table */}
      <div className="">
        <TanStackTable
          data={tableData || []}
          columns={columns}
          tableType="teamDaysOff"
          error={error}
          isLoading={isLoading}
          enableRowSelection={authUser?.role === 'admin'}
          showBulkActions={authUser?.role === 'admin'}
          onSelect={handleEdit}
          onEdit={handleEdit}
          onDelete={null}
          bulkActions={authUser?.role === 'admin' ? [
            {
              label: "View Selected",
              icon: "eye",
              variant: "secondary",
              onClick: (selectedItems) => {
                if (selectedItems.length === 1) {
                  handleEdit(selectedItems[0]);
                }
              }
            },
            {
              label: "Edit Selected",
              icon: "edit",
              variant: "primary",
              onClick: (selectedItems) => {
                if (selectedItems.length === 1) {
                  handleEdit(selectedItems[0]);
                }
              }
            }
          ] : []}
        />
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <TeamDaysOffFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          mode="create"
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <TeamDaysOffFormModal
          isOpen={showEditModal}
          onClose={closeEditModal}
          mode={editingItem.hasEntry ? "edit" : "create"}
          teamDaysOff={editingItem.hasEntry ? editingItem : null}
          initialUserId={editingItem.userUID || editingItem.userId}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* How to Use Calendar Section */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            How to Use Calendar
          </h2>

          {/* Important Notes */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="font-medium mb-3 text-gray-900 dark:text-white">
              Important Notes:
            </p>
            <div className="space-y-2">
              <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                <li>
                  <span className="font-medium">Base Days Required</span> - Users must have base days configured before selecting dates. Admins need to create a record with base days first.
                </li>
                <li>
                  <span className="font-medium">Past Dates</span> - Past dates cannot be selected or removed. They are grayed out and locked to prevent changes to historical data.
                </li>
                <li>
                  <span className="font-medium">Weekends</span> - Weekends (Saturday and Sunday) cannot be selected. Only weekdays can be marked as days off.
                </li>
                <li>
                  <span className="font-medium">Multiple Users</span> - Admins can view and manage days off for all team members. Regular users can only see and manage their own days off.
                </li>
                <li>
                  <span className="font-medium">Email to HR</span> - After saving dates, use "Send Email to HR" button to notify the HR team. This helps with vacation planning and approval.
                </li>
              </ul>
            </div>
          </div>

          {/* Getting Started */}
          <div>
            <p className="font-medium mb-3 text-gray-900 dark:text-white">
              Getting Started:
            </p>
            <div className="space-y-2">
              <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                <li>
                  <span className="font-medium">Admins</span> - Click "Add Entry" to create a user's days off record with base days. You can manage days off for any team member.
                </li>
                <li>
                  <span className="font-medium">Regular Users</span> - Your days off record is automatically selected when opening the calendar. You can view and manage your own vacation days.
                </li>
                <li>
                  <span className="font-medium">Base Days</span> - Initial days off allocated to a user. This is the starting number of vacation days.
                </li>
                <li>
                  <span className="font-medium">Monthly Accrual</span> - System automatically adds 1.75 days per month since the record was created. This accumulates over time.
                </li>
                <li>
                  <span className="font-medium">Calendar View</span> - The calendar shows all team members' days off with color coding. Each user has a unique color for easy identification.
                </li>
              </ul>
            </div>
          </div>

          {/* Managing Days Off */}
          <div>
            <p className="font-medium mb-3 text-gray-900 dark:text-white">
              Managing Days Off:
            </p>
            <div className="space-y-2">
              <ul className="list-disc list-inside ml-2 text-gray-600 dark:text-gray-400">
                <li>
                  <span className="font-medium">Select User</span> - Admins can select any user from the dropdown menu (top right of calendar). Regular users see only their own record.
                </li>
                <li>
                  <span className="font-medium">Select Dates</span> - Click on calendar dates to select days off. Weekends and past dates are automatically disabled and cannot be selected.
                </li>
                <li>
                  <span className="font-medium">Save Dates</span> - Click "Save" button to save your selected dates. Changes are saved immediately and visible to all users.
                </li>
                <li>
                  <span className="font-medium">Remove Dates</span> - Click the "×" button on saved dates to remove them. You can only remove future dates, not past ones.
                </li>
                <li>
                  <span className="font-medium">Edit User Record</span> - Admins can edit base days and total days off count for any user. Click the edit button to modify user settings.
                </li>
                <li>
                  <span className="font-medium">View All Users</span> - The calendar displays all team members' days off simultaneously. Use the color legend to identify who has time off on specific dates.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default TeamDaysOffPage;

