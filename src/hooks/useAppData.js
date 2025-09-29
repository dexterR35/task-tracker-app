import { useMemo, useCallback, useState } from "react";
import { useGetUsersQuery, useGetUserByUIDQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { 
  useGetMonthTasksQuery, 
  useGetCurrentMonthQuery,
  useGetAvailableMonthsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation
} from "@/features/tasks/tasksApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getUserUID, isUserAdmin } from "@/features/utils/authUtils";
import { logger } from "@/utils/logger";
import { getCurrentMonthInfo, getMonthDateRange } from "@/utils/monthUtils";


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

// Simplified hook for month selection - uses APIs directly
export const useMonthSelection = (selectedUserId = null) => {
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
  
  // Fetch current month data
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
  
  // Extract current month data
  const { 
    currentMonth = {}, 
    currentMonthBoard = null,
    boardExists = false,
    currentMonthTasks = []
  } = currentMonthData;

  const { monthId, monthName, daysInMonth, startDate, endDate } = currentMonth;
  
  // Use centralized month utilities for consistent month handling
  const currentMonthInfo = useMemo(() => {
    if (monthId) {
      return getMonthDateRange(monthId);
    }
    return getCurrentMonthInfo();
  }, [monthId]);

  // Fetch available months by default so they show in the dropdown
  const { 
    data: availableMonths = [], 
    isLoading: availableMonthsLoading,
    refetch: fetchAvailableMonths
  } = useGetAvailableMonthsQuery(undefined, {
    skip: !user // Only skip if user is not authenticated
  });


  // Create dropdown options with current month always available
  const dropdownOptions = useMemo(() => {
    const options = [];
    
    // Always include current month first (only if we have the data)
    if (monthId && monthName) {
      options.push({
        monthId: monthId,
        monthName: monthName,
        isCurrent: true,
        boardExists: boardExists
      });
    }
    
    // Add other available months (only if fetched)
    if (availableMonths.length > 0) {
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
  const shouldFetchTasks = targetMonthId && userData.userUID;
  
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
  const rawTasks = useMemo(() => {
    return isFetchingSelectedMonth 
      ? monthTasks  // Selected month data
      : (currentMonthTasks || []); // Current month data
  }, [isFetchingSelectedMonth, monthTasks, currentMonthTasks]);
  
  // Apply user-based filtering in the UI - optimized memoization
  const displayTasks = useMemo(() => {
    if (!rawTasks || rawTasks.length === 0) return [];
    
    // If user is admin, show all tasks
    if (userIsAdmin) {
      return rawTasks;
    }
    
    // If user is not admin, filter to only their tasks
    return rawTasks.filter(task => 
      task.userUID === userUID || task.createbyUID === userUID
    );
  }, [rawTasks, userIsAdmin, userUID]);
  
  
  // Helper functions
  const selectMonth = useCallback(async (monthId) => {
    setSelectedMonthId(monthId);
    
    // If selecting a different month and we haven't fetched available months yet, fetch them
    if (monthId !== currentMonth.monthId && availableMonths.length === 0) {
      fetchAvailableMonths();
    }
    
    // Trigger immediate refetch for real-time updates
    try {
      if (monthId && monthId !== currentMonth.monthId) {
        // Force refetch for selected month
        await refetchMonthTasks?.();
      } else if (monthId === currentMonth.monthId) {
        // Refetch current month data
        await refetchCurrentMonth?.();
      }
    } catch (error) {
      console.warn('Failed to refetch data on month selection:', error);
    }
  }, [currentMonth.monthId, availableMonths.length, refetchMonthTasks, refetchCurrentMonth]);
  
  const resetToCurrentMonth = useCallback(() => {
    setSelectedMonthId(null);
  }, []);
  
  const isCurrentMonth = !selectedMonthId || selectedMonthId === monthId;
  
  // Determine if we're still loading initial month data
  const isInitialLoading = currentMonthLoading && !monthId;
  const isMonthDataReady = monthId && monthName;
  
  return {
    // Month data
    currentMonth: {
      monthId,
      monthName,
      daysInMonth,
      startDate,
      endDate,
      boardExists,
      isCurrent: true,
      isReady: isMonthDataReady
    },
    selectedMonth: isCurrentMonth ? null : {
      monthId: selectedMonthId,
      monthName: dropdownOptions.find(m => m.monthId === selectedMonthId)?.monthName,
      isCurrent: false
    },
    availableMonths: dropdownOptions,
    isCurrentMonth,
    
    // Task data
    tasks: displayTasks,
    currentMonthTasks,
    
    // Status
    isLoading: isFetchingSelectedMonth ? monthTasksLoading : currentMonthLoading,
    isInitialLoading, // New: specific flag for initial month loading
    isMonthDataReady, // New: flag indicating month data is available
    error: isFetchingSelectedMonth ? monthTasksError : currentMonthError,
    
    // Helper functions
    selectMonth,
    resetToCurrentMonth,
    fetchAvailableMonths,
    refetchCurrentMonth,
    refetchMonthTasks,
    
    // User data
    user: userData.user,
    userData: userData.userData,
    isAdmin: userData.userIsAdmin
  };
};

export const useAppData = (selectedUserId = null) => {
  // Use the simplified month selection hook
  const monthSelectionData = useMonthSelection(selectedUserId);
  const userData = useUserData();
  
  // Fetch all reporters (needed for task creation) - only when user is authenticated
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError 
  } = useGetReportersQuery(undefined, {
    skip: !userData.userUID // Skip query until user is authenticated
  });
  
  // Task mutations - available to all components
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  
  // Extract month data from the consolidated hook
  const monthData = {
    monthId: monthSelectionData.currentMonth.monthId,
    monthName: monthSelectionData.currentMonth.monthName,
    daysInMonth: monthSelectionData.currentMonth.daysInMonth,
    startDate: monthSelectionData.currentMonth.startDate,
    endDate: monthSelectionData.currentMonth.endDate,
    boardExists: monthSelectionData.currentMonth.boardExists,
    availableMonths: monthSelectionData.availableMonths,
    currentMonthTasks: monthSelectionData.currentMonthTasks,
    isLoading: monthSelectionData.isLoading,
    error: monthSelectionData.error,
    refetchCurrentMonth: monthSelectionData.refetchCurrentMonth,
    refetchMonthTasks: monthSelectionData.refetchMonthTasks
  };
  
  // Current month tasks are now included in monthData from the consolidated hook
  const tasksData = monthSelectionData.tasks || [];

  
  // Combine errors from all sources
  const error = userData.error || reportersError || monthData.error;
  
  // Combined loading state
  const isLoading = userData.isLoading || reportersLoading || monthData.isLoading;
  
  
  // Date objects
  const memoizedStartDate = monthData.startDate ? new Date(monthData.startDate) : null;
  const memoizedEndDate = monthData.endDate ? new Date(monthData.endDate) : null;

  // Return the data object
  const baseData = {
    // Task mutations - available to all users
    createTask,
    updateTask,
    deleteTask,
    
    // Common data
    reporters: reporters || [],
    tasks: tasksData || [],
    isLoading,
    error,
    
    // Month data (from consolidated hook) - with safety checks
    monthId: monthData.monthId || null,
    monthName: monthData.monthName || null,
    daysInMonth: monthData.daysInMonth || null,
    startDate: memoizedStartDate,
    endDate: memoizedEndDate,
    boardExists: monthData.boardExists || false,
    availableMonths: monthData.availableMonths || [],
    
    // Refetch functions for real-time updates
    refetchCurrentMonth: monthData.refetchCurrentMonth,
    refetchMonthTasks: monthData.refetchMonthTasks
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
