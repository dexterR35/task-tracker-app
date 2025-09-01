import { useSelector } from 'react-redux';
import { useMemo, useRef, useCallback, useEffect } from 'react';
import { selectCurrentMonthName, selectCurrentMonthId, selectBoardExists } from '../../features/currentMonth/currentMonthSlice';
import { useAuth } from './useAuth';
import { useGetMonthTasksQuery } from '../../features/tasks/tasksApi';
import { useGetUsersQuery } from '../../features/users/usersApi';
import { useGetReportersQuery } from '../../features/reporters/reportersApi';
import { logger } from '../utils/logger';


export const useFetchData = (userId = null) => {
  const prevDataRef = useRef(null);
  const { user, canAccess, isLoading: authLoading, isAuthChecking } = useAuth();
  
  // Get month data from Redux store
  const monthName = useSelector(selectCurrentMonthName);
  const monthId = useSelector(selectCurrentMonthId);
  const boardExists = useSelector(selectBoardExists);
  
  logger.debug('[useFetchData] Hook initialized:', {
    userId,
    monthId,
    monthName,
    boardExists,
    authLoading,
    isAuthChecking
  });
  
  // Normalize userId - memoized to prevent recalculation
  const normalizedUserId = useMemo(() => {
    if (!userId || userId === "" || userId === "null") {
      logger.debug('[useFetchData] Normalized userId to null');
      return null;
    }
    if (canAccess('admin') && !userId) {
      logger.debug('[useFetchData] Admin user, normalized userId to null');
      return null;
    }
    logger.debug('[useFetchData] Normalized userId:', userId);
    return userId;
  }, [userId, canAccess]);

  // Determine if we should skip data fetching - memoized
  const shouldSkip = useMemo(() => {
    const skip = authLoading || isAuthChecking || !monthId || !boardExists || !user;
    logger.debug('[useFetchData] Should skip data fetching:', {
      skip,
      authLoading,
      isAuthChecking,
      monthId,
      boardExists,
      hasUser: !!user
    });
    return skip;
  }, [authLoading, isAuthChecking, monthId, boardExists, user]);

  // Determine if we should skip global data fetching (users and reporters)
  const shouldSkipGlobalData = useMemo(() => {
    const skip = authLoading || isAuthChecking || !user;
    logger.debug('[useFetchData] Should skip global data fetching:', {
      skip,
      authLoading,
      isAuthChecking,
      hasUser: !!user
    });
    return skip;
  }, [authLoading, isAuthChecking, user]);
  
  // Fetch tasks, users, and reporters data
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useGetMonthTasksQuery(
    { monthId, userId: normalizedUserId },
    { skip: shouldSkip } // Tasks depend on board existence
  );
  
  const { data: users = [], isLoading: usersLoading, error: usersError } = useGetUsersQuery(
    undefined,
    { skip: shouldSkipGlobalData } // Users are global, don't depend on board
  );
  
  const { data: reporters = [], isLoading: reportersLoading, error: reportersError } = useGetReportersQuery(
    undefined,
    { skip: shouldSkipGlobalData } // Reporters are global, don't depend on board
  );

  // Log data fetching results
  useEffect(() => {
    if (!shouldSkip || !shouldSkipGlobalData) {
      logger.debug('[useFetchData] Data fetching results:', {
        tasksCount: tasks.length,
        usersCount: users.length,
        reportersCount: reporters.length,
        tasksLoading: shouldSkip ? 'skipped' : tasksLoading,
        usersLoading: shouldSkipGlobalData ? 'skipped' : usersLoading,
        reportersLoading: shouldSkipGlobalData ? 'skipped' : reportersLoading,
        tasksError: shouldSkip ? 'skipped' : tasksError?.message,
        usersError: shouldSkipGlobalData ? 'skipped' : usersError?.message,
        reportersError: shouldSkipGlobalData ? 'skipped' : reportersError?.message,
        shouldSkip,
        shouldSkipGlobalData
      });
    }
  }, [tasks.length, users.length, reporters.length, tasksLoading, usersLoading, reportersLoading, tasksError, usersError, reportersError, shouldSkip, shouldSkipGlobalData]);

  // Determine loading state
  const isLoading = useMemo(() => {
    // Only consider loading states for data that we're actually trying to fetch
    const tasksLoadingState = shouldSkip ? false : tasksLoading;
    const usersLoadingState = shouldSkipGlobalData ? false : usersLoading;
    const reportersLoadingState = shouldSkipGlobalData ? false : reportersLoading;
    
    const loading = authLoading || isAuthChecking || tasksLoadingState || usersLoadingState || reportersLoadingState;
    logger.debug('[useFetchData] Loading state:', {
      loading,
      authLoading,
      isAuthChecking,
      tasksLoading: tasksLoadingState,
      usersLoading: usersLoadingState,
      reportersLoading: reportersLoadingState,
      shouldSkip,
      shouldSkipGlobalData
    });
    return loading;
  }, [authLoading, isAuthChecking, tasksLoading, usersLoading, reportersLoading, shouldSkip, shouldSkipGlobalData]);

  // Determine error state
  const error = useMemo(() => {
    // Only consider errors for data that we're actually trying to fetch
    const tasksErrorState = shouldSkip ? null : tasksError;
    const usersErrorState = shouldSkipGlobalData ? null : usersError;
    const reportersErrorState = shouldSkipGlobalData ? null : reportersError;
    
    const hasError = tasksErrorState || usersErrorState || reportersErrorState;
    if (hasError) {
      logger.error('[useFetchData] Error detected:', {
        tasksError: tasksErrorState?.message,
        usersError: usersErrorState?.message,
        reportersError: reportersErrorState?.message,
        shouldSkip,
        shouldSkipGlobalData
      });
    }
    return hasError;
  }, [tasksError, usersError, reportersError, shouldSkip, shouldSkipGlobalData]);

  // Check if data has changed - memoized
  const hasData = useMemo(() => {
    const hasDataResult = tasks.length > 0 || users.length > 0 || reporters.length > 0;
    logger.debug('[useFetchData] Has data:', {
      hasData: hasDataResult,
      tasksCount: tasks.length,
      usersCount: users.length,
      reportersCount: reporters.length
    });
    return hasDataResult;
  }, [tasks.length, users.length, reporters.length]);

  // Cache management - memoized
  const cacheKey = useMemo(() => {
    const key = `${monthId}-${normalizedUserId}-${tasks.length}-${users.length}-${reporters.length}`;
    logger.debug('[useFetchData] Cache key generated:', key);
    return key;
  }, [monthId, normalizedUserId, tasks.length, users.length, reporters.length]);

  // Check if data has changed since last render
  useEffect(() => {
    if (cacheKey !== prevDataRef.current) {
      logger.debug('[useFetchData] Data changed, updating cache:', {
        oldKey: prevDataRef.current,
        newKey: cacheKey
      });
      prevDataRef.current = cacheKey;
    }
  }, [cacheKey]);

  // Log final return object
  useEffect(() => {
    logger.debug('[useFetchData] Hook returning data:', {
      tasksCount: tasks.length,
      usersCount: users.length,
      reportersCount: reporters.length,
      isLoading,
      hasError: !!error,
      hasData,
      monthId,
      normalizedUserId,
      shouldSkip,
      shouldSkipGlobalData
    });
  }, [tasks.length, users.length, reporters.length, isLoading, error, hasData, monthId, normalizedUserId, shouldSkip, shouldSkipGlobalData]);

  // Cleanup effect for logout
  useEffect(() => {
    if (!user && !isAuthChecking) {
      logger.debug('[useFetchData] User logged out, cleaning up data');
    }
  }, [user, isAuthChecking]);

  return {
    // Raw data
    tasks,
    users,
    reporters,
    
    // Auth data
    user,
    canAccess,
    
    // Loading states
    isLoading,
    
    // Error states
    error,
    
    // Context data
    monthId,
    monthName,
    normalizedUserId,
    hasData,
    
    // Cache info
    cacheKey
  };
};


