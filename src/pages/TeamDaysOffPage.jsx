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

      {/* Calendar */}
      <DaysOffCalendar teamDaysOff={teamDaysOff || []} />

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

    </div>
  );
};

export default TeamDaysOffPage;

