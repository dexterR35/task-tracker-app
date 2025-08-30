import { useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectBoardExists } from '../../../features/currentMonth/currentMonthSlice';
import { logger } from '../../utils/logger';

/**
 * Hook responsible only for filtering and processing raw data
 * Separates data filtering concerns from fetching and calculation
 */
export const useDataFilter = (rawData) => {
  const dispatch = useDispatch();
  const { tasks, allUsers, currentUser, reporters, boardData, canAccess, monthId } = rawData;
  
  logger.log('[useDataFilter] Filtering data for', { 
    tasksCount: tasks?.length, 
    usersCount: allUsers?.length,
    reportersCount: reporters?.length 
  });

  // Filter users based on role - memoized to prevent recalculation
  const users = useMemo(() => {
    if (canAccess('admin')) {
      return allUsers; // Admin sees all users
    } else if (currentUser) {
      return [currentUser]; // Regular user sees only themselves
    }
    return [];
  }, [allUsers, currentUser, canAccess]);

  // Get board status from Redux store
  const boardExists = useSelector(selectBoardExists);

  // Use real-time board data if available, otherwise fall back to Redux store
  const effectiveBoardExists = useMemo(() => 
    boardData?.exists !== undefined ? boardData.exists : boardExists,
    [boardData?.exists, boardExists]
  );

  // Update Redux store when board status changes in real-time - use useEffect for side effects
  useEffect(() => {
    if (boardData?.exists !== undefined && boardData.exists !== boardExists) {
      // Import the action dynamically to avoid circular dependencies
      import('../../../features/currentMonth/currentMonthSlice').then(({ setBoardExists }) => {
        dispatch(setBoardExists(boardData.exists));
        logger.log('[useDataFilter] Board status updated in Redux:', { 
          from: boardExists, 
          to: boardData.exists,
          monthId 
        });
      });
    }
  }, [boardData?.exists, boardExists, dispatch, monthId]);

  // Data availability check - memoized
  const hasData = useMemo(() => 
    tasks.length > 0 || users.length > 0 || reporters.length > 0,
    [tasks.length, users.length, reporters.length]
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Filtered data
    tasks,
    users,
    reporters,
    
    // State
    boardExists: effectiveBoardExists,
    hasData,
    
    // Metadata
    monthId
  }), [tasks, users, reporters, effectiveBoardExists, hasData, monthId]);
};
