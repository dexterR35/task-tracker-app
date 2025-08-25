import React from 'react';
import { useGetMonthBoardExistsQuery } from '../tasksApi';
import { useSubscribeToUsersQuery } from '../../users/usersApi';
import Loader from '../../../shared/components/ui/Loader';
import { format } from 'date-fns';

const DashboardLoader = ({ 
  children, 
  monthId, 
  isAdmin = false,
  userId = null,
  showCreateBoard = false, // New prop to show create board functionality
  onGenerateBoard = null   // New prop for create board callback
}) => {
  // Check if board exists
  const { 
    data: board = { exists: false }, 
    isLoading: boardLoading,
    error: boardError 
  } = useGetMonthBoardExistsQuery({ monthId });

  // For admin users, also check if users are loaded
  const { 
    isLoading: usersLoading 
  } = useSubscribeToUsersQuery(undefined, {
    skip: !isAdmin
  });

  // Determine loading states
  const isDataLoading = boardLoading || (isAdmin && usersLoading);

  // Show data loading
  if (isDataLoading) {
    return (
      <Loader 
        size="md" 
        text={`Loading ${format(new Date(monthId + "-01"), "MMMM yyyy")} data...`} 
        variant="dots"
      />
    );
  }

  // Show error state
  if (boardError) {
    return (
      <div className="flex-center flex-col space-y-4 p-8">
        <div className="text-red-400 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-sm">
            {boardError?.message || 'Failed to load dashboard data. Please try refreshing the page.'}
          </p>
        </div>
      </div>
    );
  }

  // Show board not ready message (only if we don't want to show create board functionality)
  if (!board?.exists && !showCreateBoard) {
    return (
      <div className="flex-center flex-col space-y-4 p-8">
        <div className="text-yellow-400 text-center">
          <h3 className="text-lg font-semibold mb-2">Board Not Ready</h3>
          <p className="text-sm">
            The board for {format(new Date(monthId + "-01"), "MMMM yyyy")} is not created yet.
            {isAdmin ? ' You can create it from the dashboard.' : ' Please contact an admin.'}
          </p>
        </div>
      </div>
    );
  }

  // Everything is loaded, show the actual dashboard
  return children;
};

export default DashboardLoader;
