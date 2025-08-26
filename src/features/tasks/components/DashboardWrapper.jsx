import React, { useMemo } from 'react';
import { useSubscribeToMonthTasksQuery } from '../tasksApi';
import { useAuth } from '../../../shared/hooks/useAuth';
import OptimizedTaskMetricsBoard from './OptimizedTaskMetricsBoard';
import TasksTable from './TasksTable';

const DashboardWrapper = ({
  monthId,
  userId = null,
  isAdmin = false,
  showTable = true, // New prop to control table visibility
  className = ""
}) => {
  const { isAuthenticated } = useAuth();
  
  // Memoize the query parameters to prevent unnecessary re-renders
  const queryParams = useMemo(() => ({
    monthId, 
    userId: userId || null
  }), [monthId, userId]);
  
  // Use the real-time subscription to get tasks
  const {
    data: tasks = [],
    error: tasksError
  } = useSubscribeToMonthTasksQuery(
    queryParams,
    {
      // Skip if no monthId or not authenticated
      skip: !monthId || !isAuthenticated
      // No polling needed - onSnapshot handles real-time updates
    }
  );

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Show error state
  if (tasksError) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center text-red-400 py-8">
          <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-sm">
            {tasksError?.message || 'Failed to load dashboard data. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metrics Board - Always show, even with zero data */}
      <OptimizedTaskMetricsBoard
        monthId={monthId}
        userId={userId}
        showSmallCards={true}
      />
      
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-2">
          Debug: {tasks.length} tasks loaded for {userId || 'all users'}
        </div>
      )}

      {/* Tasks Table - Show only if we have data AND showTable is true */}
      {showTable && tasks.length > 0 && (
        <TasksTable
          monthId={monthId}
          tasks={tasks}
          loading={false}
          error={null}
          userFilter={userId}
          showUserFilter={isAdmin}
          isAdmin={isAdmin}
          boardExists={true} // We know board exists if we're getting data
          boardLoading={false}
        />
      )}

      {/* Show message if no tasks */}
      {tasks.length === 0 && (
        <div className="bg-primary border rounded-lg p-6 text-center text-sm text-gray-200">
          {userId 
            ? `No tasks found for user ${userId} in ${monthId}.`
            : `No tasks found for ${monthId}.`
          }
        </div>
      )}
    </div>
  );
};

export default DashboardWrapper;
