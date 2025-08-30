import { useSelector } from 'react-redux';
import { useAuth } from '../useAuth';
import { selectCurrentMonthId } from '../../../features/currentMonth/currentMonthSlice';
import { useSubscribeToMonthTasksQuery } from '../../../features/tasks/tasksApi';
import { useGetUsersQuery, useGetUserByUIDQuery } from '../../../features/users/usersApi';
import { useGetReportersQuery } from '../../../features/reporters/reportersApi';
import { logger } from '../../utils/logger';
import { useMemo, useRef } from 'react';

/**
 * Hook responsible only for fetching data from various APIs
 * Separates data fetching concerns from filtering and calculation
 */
export const useDataFetcher = (userId = null) => {
  const { user, canAccess, isLoading: authLoading, isAuthChecking } = useAuth();
  const prevDataRef = useRef(null);
  
  // Get current month from Redux store
  const monthId = useSelector(selectCurrentMonthId);
  
  // Skip API calls if not authenticated or still checking auth
  const shouldSkip = !user || authLoading || isAuthChecking;
  
  // Enhanced monthId validation
  const isValidMonthId = monthId && 
    typeof monthId === 'string' && 
    monthId.match(/^\d{4}-\d{2}$/);
  
  const shouldSkipMonthData = shouldSkip || !isValidMonthId;

  // Normalize userId - convert empty string or "null" string to null
  // Also normalize to prevent multiple cache entries for the same data
  const normalizedUserId = useMemo(() => {
    if (!userId || userId === "" || userId === "null") {
      return null;
    }
    
    // For admins viewing all users, always use null to share cache
    if (canAccess('admin') && !userId) {
      return null;
    }
    
    return userId;
  }, [userId, canAccess]);

  // Fetch tasks and board status (combined real-time subscription)
  const { 
    data: tasksData = { tasks: [], boardExists: false, monthId }, 
    error: tasksError, 
    isLoading: tasksLoading,
    isFetching: tasksFetching 
  } = useSubscribeToMonthTasksQuery(
    { monthId: isValidMonthId ? monthId : undefined, userId: normalizedUserId },
    { skip: shouldSkipMonthData }
  );

  // Extract tasks and board data from combined response
  const tasks = tasksData.tasks || [];
  const boardData = { exists: tasksData.boardExists, monthId: tasksData.monthId };

  // Fetch users (cached)
  const { 
    data: allUsers = [], 
    error: allUsersError, 
    isLoading: allUsersLoading,
    isFetching: allUsersFetching 
  } = useGetUsersQuery(
    {},
    { 
      skip: shouldSkip || !canAccess('admin'), // Only admins fetch all users
      keepUnusedDataFor: 300,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  // Fetch current user data (for regular users)
  const { 
    data: currentUser = null, 
    error: currentUserError, 
    isLoading: currentUserLoading,
    isFetching: currentUserFetching 
  } = useGetUserByUIDQuery(
    { userUID: user?.uid },
    { 
      skip: shouldSkip || !user?.uid || canAccess('admin'), // Only regular users need this
      keepUnusedDataFor: 300,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  // Fetch reporters (cached)
  const { 
    data: reporters = [], 
    error: reportersError, 
    isLoading: reportersLoading,
    isFetching: reportersFetching 
  } = useGetReportersQuery(
    {},
    { 
      skip: shouldSkip,
      keepUnusedDataFor: 300,
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }
  );

  // Combined loading states (removed boardLoading since it's now part of tasksLoading)
  const isLoading = tasksLoading || allUsersLoading || currentUserLoading || reportersLoading || authLoading || isAuthChecking;
  const isFetching = tasksFetching || allUsersFetching || currentUserFetching || reportersFetching;

  // Combined error state (removed boardError since it's now part of tasksError)
  const error = tasksError || allUsersError || currentUserError || reportersError;

  const result = {
    // Raw data
    tasks,
    allUsers,
    currentUser,
    reporters,
    boardData,
    
    // State
    isLoading,
    isFetching,
    error,
    
    // Metadata
    monthId,
    normalizedUserId,
    canAccess,
    user
  };

  // Only log when data actually changes to reduce console noise
  const currentDataKey = `${tasks.length}-${allUsers.length}-${reporters.length}-${monthId}-${normalizedUserId}`;
  if (prevDataRef.current !== currentDataKey) {
    logger.log('[useDataFetcher] Data updated:', {
      tasksCount: tasks.length,
      usersCount: allUsers.length,
      reportersCount: reporters.length,
      monthId,
      userId: normalizedUserId
    });
    prevDataRef.current = currentDataKey;
  }

  return result;
};
