import { useMemo, useCallback, useState, useEffect } from "react";
import { useGetUsersQuery } from "@/features/users/usersApi";
import { useGetUserByUIDQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useGetMonthTasksQuery, useGetCurrentMonthQuery } from "@/features/tasks/tasksApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getUserUID, isUserAdmin } from "@/utils/authUtils";
import { logger } from "@/utils/logger";


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
  
  return useMemo(() => ({
    user,
    userData,
    allUsers,
    userUID,
    userIsAdmin,
    isLoading: userLoading || usersLoading,
    error: userError || usersError
  }), [user, userData, allUsers, userUID, userIsAdmin, userLoading, usersLoading, userError, usersError]);
};

// Hook for components that need month selection with task data fetching
export const useMonthSelectionWithTasks = () => {
  const { user } = useAuth();
  const userUID = getUserUID(user);
  const userIsAdmin = isUserAdmin(user);
  const userData = useUserData();
  const [selectedMonthId, setSelectedMonthId] = useState(null);
  
  // Fetch current month data with tasks
  const { 
    data: currentMonthData = {}, 
    isLoading: currentMonthLoading, 
    error: currentMonthError 
  } = useGetCurrentMonthQuery(
    {
      userId: userIsAdmin ? undefined : userUID,
      role: userIsAdmin ? 'admin' : 'user',
      userData: user
    },
    {
      skip: !user // Skip query until user is authenticated
    }
  );
  
  // Extract month data
  const monthData = useMemo(() => {
    const { 
      currentMonth = {}, 
      availableMonths = [], 
      boardExists = false,
      currentMonthTasks = []
    } = currentMonthData;
    
    const { monthId, monthName, daysInMonth, startDate, endDate } = currentMonth;
    
    return {
      currentMonth,
      availableMonths,
      boardExists,
      currentMonthTasks,
      monthId,
      monthName,
      daysInMonth,
      startDate,
      endDate,
      isLoading: currentMonthLoading,
      error: currentMonthError
    };
  }, [currentMonthData, currentMonthLoading, currentMonthError]);
  
  // Fetch selected month tasks when a different month is selected (on-demand)
  const shouldFetchSelectedMonth = selectedMonthId && 
    selectedMonthId !== monthData.monthId && 
    userData.userUID;
  
  if (shouldFetchSelectedMonth) {
    logger.log(`[useMonthSelectionWithTasks] Fetching selected month data for: ${selectedMonthId}`);
  }
  
  
  const { 
    data: selectedMonthTasks = [], 
    isLoading: selectedMonthLoading, 
    error: selectedMonthError 
  } = useGetMonthTasksQuery(
    { 
      monthId: selectedMonthId || '', 
      userId: userData.userIsAdmin ? undefined : userData.userUID,
      role: userData.userIsAdmin ? 'admin' : 'user',
      userData: userData.userIsAdmin ? userData.user : userData.userData
    },
    { skip: !shouldFetchSelectedMonth }
  );
  
  // Get all available months for dropdown
  const availableMonths = useMemo(() => {
    const months = [...monthData.availableMonths];
    
    // Ensure current month is included
    if (monthData.monthId && !months.find(m => m.monthId === monthData.monthId)) {
      months.unshift({
        monthId: monthData.monthId,
        monthName: monthData.monthName,
        isCurrent: true,
        boardExists: monthData.boardExists
      });
    }
    
    return months.sort((a, b) => {
      // Current month first, then by monthId (newest first)
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return b.monthId.localeCompare(a.monthId);
    });
  }, [monthData.availableMonths, monthData.monthId, monthData.monthName, monthData.boardExists]);
  
  // Get tasks for display (current month or selected month)
  const displayTasks = useMemo(() => {
    if (selectedMonthId && selectedMonthId !== monthData.monthId) {
      // Show selected month tasks (on-demand fetch with real-time listener)
      logger.log(`[useMonthSelectionWithTasks] Using selected month data: ${selectedMonthTasks.length} tasks for ${selectedMonthId}`);
      return selectedMonthTasks;
    } else {
      // Show current month tasks (from getCurrentMonth query with real-time listener)
      const currentTasks = monthData.currentMonthTasks || [];
      logger.log(`[useMonthSelectionWithTasks] Using current month data: ${currentTasks.length} tasks for ${monthData.monthId}`);
      return currentTasks;
    }
  }, [selectedMonthId, monthData.monthId, selectedMonthTasks, monthData.currentMonthTasks]);
  
  // Get current month info
  const currentMonthInfo = useMemo(() => ({
    monthId: monthData.monthId,
    monthName: monthData.monthName,
    boardExists: monthData.boardExists,
    isCurrent: true
  }), [monthData]);
  
  // Get selected month info
  const selectedMonthInfo = useMemo(() => {
    if (!selectedMonthId || selectedMonthId === monthData.monthId) {
      return currentMonthInfo;
    }
    
    const month = availableMonths.find(m => m.monthId === selectedMonthId);
    return month ? {
      monthId: month.monthId,
      monthName: month.monthName,
      boardExists: month.boardExists,
      isCurrent: false
    } : null;
  }, [selectedMonthId, monthData.monthId, availableMonths, currentMonthInfo]);
  
  // Helper functions
  const selectMonth = useCallback((monthId) => {
    setSelectedMonthId(monthId);
    logger.log(`📅 Selected month: ${monthId}`);
  }, []);
  
  const resetToCurrentMonth = useCallback(() => {
    setSelectedMonthId(null);
    logger.log(`📅 Reset to current month: ${monthData.monthId}`);
  }, [monthData.monthId]);
  
  const isCurrentMonth = !selectedMonthId || selectedMonthId === monthData.monthId;
  
  return {
    // Month data
    currentMonth: currentMonthInfo,
    selectedMonth: selectedMonthInfo,
    availableMonths,
    isCurrentMonth,
    
    // Task data
    tasks: displayTasks,
    currentMonthTasks: monthData.currentMonthTasks || [],
    selectedMonthTasks,
    
    // Status
    isLoading: selectedMonthId ? selectedMonthLoading : monthData.isLoading,
    error: selectedMonthId ? selectedMonthError : monthData.error,
    
    // Helper functions
    selectMonth,
    resetToCurrentMonth,
    
    // User data
    user: userData.user,
    userData: userData.userData,
    isAdmin: userData.userIsAdmin
  };
};

export const useAppData = () => {
  // Use the consolidated hook that handles both current month and month selection
  const monthSelectionData = useMonthSelectionWithTasks();
  const userData = useUserData();
  
  // Fetch all reporters (needed for task creation) - only when user is authenticated
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError 
  } = useGetReportersQuery(undefined, {
    skip: !userData.userUID // Skip query until user is authenticated
  });
  
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
    error: monthSelectionData.error
  };
  
  // Current month tasks are now included in monthData from the consolidated hook
  const tasksData = monthSelectionData.tasks || [];

  
  // Combine errors from all sources
  const error = userData.error || reportersError || monthData.error;
  
  // Combined loading state
  const isLoading = userData.isLoading || reportersLoading || monthData.isLoading;
  
  
  // Memoize expensive operations to prevent unnecessary re-renders
  const memoizedStartDate = useMemo(() => 
    monthData.startDate ? new Date(monthData.startDate) : null, 
    [monthData.startDate]
  );
  
  const memoizedEndDate = useMemo(() => 
    monthData.endDate ? new Date(monthData.endDate) : null, 
    [monthData.endDate]
  );

  // Memoize the return object to prevent unnecessary re-renders
  return useMemo(() => {
    if (userData.userIsAdmin) {
      return {
        // Admin gets everything
        user: userData.user, // Current user info from auth
        users: userData.allUsers || [], // All users for management
        reporters: reporters || [],
        tasks: tasksData || [],
        isLoading,
        error,
        isAdmin: true,
        
        // Month data (from consolidated hook)
        monthId: monthData.monthId,
        monthName: monthData.monthName,
        daysInMonth: monthData.daysInMonth,
        startDate: memoizedStartDate,
        endDate: memoizedEndDate,
        boardExists: monthData.boardExists,
        availableMonths: monthData.availableMonths || []
      };
    } else {
      return {
        // Regular user gets only their data
        user: userData.userData, // Their user data from database
        users: [], // Empty for regular users
        reporters: reporters || [],
        tasks: tasksData || [],
        isLoading,
        error,
        isAdmin: false,
        
        // Month data (from consolidated hook)
        monthId: monthData.monthId,
        monthName: monthData.monthName,
        daysInMonth: monthData.daysInMonth,
        startDate: memoizedStartDate,
        endDate: memoizedEndDate,
        boardExists: monthData.boardExists,
        availableMonths: monthData.availableMonths || []
      };
    }
  }, [
    userData.userIsAdmin,
    userData.user,
    userData.userData,
    userData.allUsers,
    reporters,
    tasksData,
    isLoading,
    error,
    monthData.monthId,
    monthData.monthName,
    monthData.daysInMonth,
    memoizedStartDate,
    memoizedEndDate,
    monthData.boardExists,
    monthData.availableMonths
  ]);
};
