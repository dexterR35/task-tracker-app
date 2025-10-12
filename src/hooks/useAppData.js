import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useGetUsersQuery, useGetUserByUIDQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useGetSettingsTypeQuery } from "@/features/settings/settingsApi";
import { 
  useGetMonthTasksQuery, 
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation
} from "@/features/tasks/tasksApi";
import {
  useGetCurrentMonthQuery,
  useGetAvailableMonthsQuery,
} from "@/features/months/monthsApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getUserUID, isUserAdmin } from "@/features/utils/authUtils";
import { logger } from "@/utils/logger";
import { getCurrentMonthInfo, getMonthDateRange } from "@/utils/monthUtils.jsx";


export const useUserData = () => {
  const { user } = useAuth();
  const userUID = getUserUID(user);
  const userIsAdmin = isUserAdmin(user);
  
  
  // Fetch user data (single user for regular users, all users for admin)
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useGetUserByUIDQuery(
    { userUID },
    { skip: !userUID || userIsAdmin } // Skip for admin users
  );
  
  // Fetch all users (admin only)
  const { 
    data: allUsers = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useGetUsersQuery(
    undefined,
    { skip: !userIsAdmin } // Only fetch for admin users
  );
  
  return {
    user,
    userData,
    allUsers,
    userUID,
    userIsAdmin,
    isLoading: userLoading || usersLoading,
    error: userError || usersError
  };
};


export const useAppData = (selectedUserId = null) => {
  const { user } = useAuth();
  const userUID = getUserUID(user);
  const userIsAdmin = isUserAdmin(user);
  const userData = useUserData();
  const [selectedMonthId, setSelectedMonthId] = useState(null);
  
  // Query parameters for current month
  const currentMonthQueryParams = {
    userId: userIsAdmin ? undefined : userUID,
    role: userIsAdmin ? 'admin' : 'user',
    userData: user
  };
  
  // Fetch current month data first
  const { 
    data: currentMonthData = {}, 
    isLoading: currentMonthLoading, 
    error: currentMonthError,
    refetch: refetchCurrentMonth
  } = useGetCurrentMonthQuery(
    currentMonthQueryParams,
    {
      skip: !user // Skip query until user is authenticated
    }
  );
  
  // Extract current month data with memoization to prevent unnecessary re-renders
  const { monthId, monthName, daysInMonth, startDate, endDate, boardExists, currentMonthTasks } = useMemo(() => {
    const { 
      currentMonth = {}, 
      boardExists = false,
      currentMonthTasks = []
    } = currentMonthData;

    const { monthId, monthName, daysInMonth, startDate, endDate } = currentMonth;
    
    return {
      monthId,
      monthName,
      daysInMonth,
      startDate,
      endDate,
      boardExists,
      currentMonthTasks
    };
  }, [currentMonthData]);
  
  // Fetch available months for dropdown
  const { 
    data: availableMonths = [], 
    isLoading: availableMonthsLoading,
    refetch: fetchAvailableMonths
  } = useGetAvailableMonthsQuery(undefined, {
    skip: !user // Only skip if user is not authenticated
  });

  // Create dropdown options with current month first
  const dropdownOptions = useMemo(() => {
    const options = [];
    
    // Always include current month first
    if (monthId && monthName) {
      options.push({
        monthId: monthId,
        monthName: monthName,
        isCurrent: true,
        boardExists: boardExists
      });
    }
    
    // Add other available months
    if (availableMonths && availableMonths.length > 0) {
      const otherMonths = availableMonths
        .filter(m => m.monthId !== monthId) // Exclude current month to avoid duplicates
        .sort((a, b) => b.monthId.localeCompare(a.monthId)); // Sort by newest first
      
      options.push(...otherMonths);
    }
    
    return options;
  }, [availableMonths, monthId, monthName, boardExists]);
  
  // Determine which month to fetch data for
  const targetMonthId = selectedMonthId || monthId;
  const isFetchingSelectedMonth = selectedMonthId && selectedMonthId !== monthId;
  
  // Determine user filtering
  const targetUserId = userIsAdmin 
    ? (selectedUserId || undefined)  // Admin: use selectedUserId or all users
    : userUID;                       // Regular user: only their data
  
  // Fetch tasks for the target month with proper user filtering
  const shouldFetchTasks = targetMonthId && (userData?.userUID || userUID);
  
  const { 
    data: monthTasks = [], 
    isLoading: monthTasksLoading, 
    error: monthTasksError,
    refetch: refetchMonthTasks
  } = useGetMonthTasksQuery(
    { 
      monthId: targetMonthId, 
      userId: targetUserId,
      role: userIsAdmin ? 'admin' : 'user',
      userData: userIsAdmin ? userData.user : userData.userData
    },
    { skip: !shouldFetchTasks }
  );
  
  // Get tasks for display with proper filtering - memoized for performance
  const displayTasks = useMemo(() => {
    // Always use monthTasks from getMonthTasks query for both current and selected months
    console.log('🔍 useAppData - Task Debug:', {
      targetMonthId,
      selectedMonthId,
      currentMonthId: monthId,
      isFetchingSelectedMonth,
      monthTasksCount: monthTasks?.length || 0,
      shouldFetchTasks,
      targetUserId,
      userUID,
      userDataUID: userData?.userUID,
      userIsAdmin,
      monthTasksLoading,
      monthTasksError: monthTasksError?.message
    });
    return monthTasks || [];
  }, [monthTasks, targetMonthId, selectedMonthId, monthId, isFetchingSelectedMonth, shouldFetchTasks, targetUserId, userUID, userData, userIsAdmin, monthTasksLoading, monthTasksError]);
  
  // Helper functions
  const selectMonth = useCallback(async (newSelectedMonthId) => {
    console.log('🔄 selectMonth called:', {
      newSelectedMonthId,
      currentMonthId: monthId,
      previousSelectedMonthId: selectedMonthId
    });
    
    setSelectedMonthId(newSelectedMonthId);
    
    // If selecting a different month and we haven't fetched available months yet, fetch them
    if (newSelectedMonthId !== monthId && availableMonths.length === 0) {
      console.log('📅 Fetching available months...');
      fetchAvailableMonths();
    }
    
    // Trigger immediate refetch for real-time updates
    try {
      if (newSelectedMonthId && newSelectedMonthId !== monthId) {
        console.log('🔄 Refetching tasks for selected month:', newSelectedMonthId);
        // Force refetch for selected month
        await refetchMonthTasks?.();
      } else if (newSelectedMonthId === monthId) {
        console.log('🔄 Refetching current month data');
        // Refetch current month data
        await refetchCurrentMonth?.();
      }
    } catch (error) {
      console.error('❌ Error in selectMonth:', error);
    }
  }, [monthId, selectedMonthId, availableMonths.length, refetchMonthTasks, refetchCurrentMonth]);
  
  const resetToCurrentMonth = useCallback(() => {
    setSelectedMonthId(null);
  }, []);
  
  const isCurrentMonth = !selectedMonthId || selectedMonthId === monthId;
  
  // Determine if we're still loading initial month data
  const isInitialLoading = currentMonthLoading && !monthId;
  const isMonthDataReady = monthId && monthName;
  
  // Memoize currentMonth object to prevent unnecessary re-renders
  const currentMonth = useMemo(() => ({
    monthId,
    monthName,
    daysInMonth,
    startDate,
    endDate,
    boardExists,
    isCurrent: true,
    isReady: isMonthDataReady
  }), [monthId, monthName, daysInMonth, startDate, endDate, boardExists, isMonthDataReady]);

  // Memoize selectedMonth object to prevent unnecessary re-renders
  const selectedMonth = useMemo(() => {
    if (isCurrentMonth) return null;
    return {
      monthId: selectedMonthId,
      monthName: dropdownOptions.find(m => m.monthId === selectedMonthId)?.monthName,
      isCurrent: false
    };
  }, [isCurrentMonth, selectedMonthId, dropdownOptions]);
  
  // Fetch all reporters - plain data, no dependencies
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError,
    refetch: refetchReporters
  } = useGetReportersQuery();
  
  // Fetch deliverables settings - global data, no dependencies
  const { 
    data: deliverablesData = null, 
    isLoading: deliverablesLoading, 
    error: deliverablesError,
    refetch: refetchDeliverables
  } = useGetSettingsTypeQuery({ settingsType: 'deliverables' });
  
  
  
  // Task mutations - available to all components
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  
  // Tasks from selected or current month
  const tasksData = displayTasks;

  
  // Combine errors from all sources
  const error = userData.error || reportersError || deliverablesError || currentMonthError || monthTasksError;
  
  // Combined loading state
  const isLoading = userData.isLoading || reportersLoading || deliverablesLoading || currentMonthLoading || monthTasksLoading;
  
  
  // Date objects
  const memoizedStartDate = startDate ? new Date(startDate) : null;
  const memoizedEndDate = endDate ? new Date(endDate) : null;

  // Return the data object
  const baseData = {
    // Task mutations - available to all users
    createTask,
    updateTask,
    deleteTask,
    
    // Common data
    reporters: reporters || [],
    deliverables: deliverablesData?.deliverables || [],
    tasks: tasksData || [],
    isLoading,
    error,
    
    // Month data (with selection support) - with safety checks
    monthId: monthId || null,
    monthName: monthName || null,
    daysInMonth: daysInMonth || null,
    startDate: memoizedStartDate,
    endDate: memoizedEndDate,
    boardExists: boardExists || false,
    availableMonths: dropdownOptions || [],
    
    // Month selection info
    currentMonth: currentMonth,
    selectedMonth: selectedMonth,
    isCurrentMonth: isCurrentMonth,
    isInitialLoading: isInitialLoading,
    isMonthDataReady: isMonthDataReady,
    
    // Month selection functions
    selectMonth: selectMonth,
    resetToCurrentMonth: resetToCurrentMonth,
    
    // Refetch functions for real-time updates
    refetchCurrentMonth: refetchCurrentMonth,
    refetchReporters,
    refetchDeliverables
  };
  
  if (userData.userIsAdmin) {
    return {
      ...baseData,
      // Admin gets everything
      user: userData.user, // Current user info from auth
      users: userData.allUsers || [], // All users for management
      isAdmin: true
    };
  } else {
    return {
      ...baseData,
      // Regular user gets only their data
      user: userData.userData, // Their user data from database
      users: [], // Empty for regular users
      isAdmin: false
    };
  }
};
