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
    const skip = authLoading || isAuthChecking || !monthId || !boardExists;
    logger.debug('[useFetchData] Should skip data fetching:', {
      skip,
      authLoading,
      isAuthChecking,
      monthId,
      boardExists
    });
    return skip;
  }, [authLoading, isAuthChecking, monthId, boardExists]);
  
  // Fetch tasks, users, and reporters data
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useGetMonthTasksQuery(
    { monthId, userId: normalizedUserId },
    { skip: shouldSkip }
  );
  
  const { data: users = [], isLoading: usersLoading, error: usersError } = useGetUsersQuery(
    undefined,
    { skip: shouldSkip }
  );
  
  const { data: reporters = [], isLoading: reportersLoading, error: reportersError } = useGetReportersQuery(
    undefined,
    { skip: shouldSkip }
  );

  // Log data fetching results
  useEffect(() => {
    if (!shouldSkip) {
      logger.debug('[useFetchData] Data fetching results:', {
        tasksCount: tasks.length,
        usersCount: users.length,
        reportersCount: reporters.length,
        tasksLoading,
        usersLoading,
        reportersLoading,
        tasksError: tasksError?.message,
        usersError: usersError?.message,
        reportersError: reportersError?.message
      });
    }
  }, [tasks.length, users.length, reporters.length, tasksLoading, usersLoading, reportersLoading, tasksError, usersError, reportersError, shouldSkip]);

  // Determine loading state
  const isLoading = useMemo(() => {
    const loading = authLoading || isAuthChecking || tasksLoading || usersLoading || reportersLoading;
    logger.debug('[useFetchData] Loading state:', {
      loading,
      authLoading,
      isAuthChecking,
      tasksLoading,
      usersLoading,
      reportersLoading
    });
    return loading;
  }, [authLoading, isAuthChecking, tasksLoading, usersLoading, reportersLoading]);

  // Determine error state
  const error = useMemo(() => {
    const hasError = tasksError || usersError || reportersError;
    if (hasError) {
      logger.error('[useFetchData] Error detected:', {
        tasksError: tasksError?.message,
        usersError: usersError?.message,
        reportersError: reportersError?.message
      });
    }
    return hasError;
  }, [tasksError, usersError, reportersError]);

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
      normalizedUserId
    });
  }, [tasks.length, users.length, reporters.length, isLoading, error, hasData, monthId, normalizedUserId]);

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


