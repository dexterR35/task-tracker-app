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
import { normalizeTimestamp } from "@/utils/dateUtils";


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
  
  // Fetch current month data first
  const { 
    data: currentMonthData = {}, 
    isLoading: currentMonthLoading, 
    error: currentMonthError
  } = useGetCurrentMonthQuery(
    {
      userUID: userIsAdmin ? undefined : userUID,
      role: userIsAdmin ? 'admin' : 'user',
      userData: user
    },
    {
      skip: !user // Skip query until user is authenticated
    }
  );
  
  // Extract current month data
  const { 
    currentMonth: currentMonthFromData = {}, 
    boardExists = false
  } = currentMonthData;

  const { monthId, monthName, daysInMonth, startDate, endDate } = currentMonthFromData;
  
  // Fetch available months for dropdown
  const { 
    data: availableMonths = [], 
    isLoading: availableMonthsLoading
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
  const targetUserUID = userIsAdmin 
    ? selectedUserId  // Admin: use selectedUserId (null means all users)
    : userUID;        // Regular user: only their data
  
  // Fetch tasks for the target month with proper user filtering
  const shouldFetchTasks = targetMonthId && (userData?.userUID || userUID);
  
  const { 
    data: monthTasks = [], 
    isLoading: monthTasksLoading, 
    error: monthTasksError
  } = useGetMonthTasksQuery(
    { 
      monthId: targetMonthId, 
      userUID: targetUserUID,
      role: userIsAdmin ? 'admin' : 'user',
      userData: userIsAdmin ? userData.user : userData.userData
    },
    { skip: !shouldFetchTasks }
  );
  
  // Tasks from selected or current month
  const tasksData = monthTasks || [];
  
  // Helper functions
  const selectMonth = useCallback((newSelectedMonthId) => {
    setSelectedMonthId(newSelectedMonthId);
  }, []);
  
  const resetToCurrentMonth = useCallback(() => {
    setSelectedMonthId(null);
  }, []);
  
  const isCurrentMonth = !selectedMonthId || selectedMonthId === monthId;
  
  // Determine if we're still loading initial month data
  const isInitialLoading = currentMonthLoading && !monthId;
  const isMonthDataReady = monthId && monthName;
  
  // Current month object
  const currentMonth = {
    monthId,
    monthName,
    daysInMonth,
    startDate,
    endDate,
    boardExists,
    isCurrent: true,
    isReady: isMonthDataReady
  };

  // Selected month object
  const selectedMonth = isCurrentMonth ? null : {
    monthId: selectedMonthId,
    monthName: dropdownOptions.find(m => m.monthId === selectedMonthId)?.monthName,
    isCurrent: false
  };
  
  // Fetch all reporters - plain data, no dependencies
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError
  } = useGetReportersQuery(undefined, {
    skip: !user // Only fetch when user is authenticated
  });
  
  // Fetch deliverables settings - global data, no dependencies
  const { 
    data: deliverablesData = null, 
    isLoading: deliverablesLoading, 
    error: deliverablesError
  } = useGetSettingsTypeQuery({ settingsType: 'deliverables' }, {
    skip: !user // Only fetch when user is authenticated
  });
  
  
  
  // Task mutations - available to all components
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  
  // Combine errors from all sources with proper error handling
  const errors = [userData.error, reportersError, deliverablesError, currentMonthError, monthTasksError];
  const error = errors.find(err => err) || null;
  
  // Combined loading state
  const isLoading = userData.isLoading || reportersLoading || deliverablesLoading || currentMonthLoading || monthTasksLoading;

  // Granular loading states for better UX
  const loadingStates = {
    isInitialLoading: isInitialLoading,
    isDataLoading: isLoading,
    isMonthLoading: currentMonthLoading,
    isTasksLoading: monthTasksLoading,
    isReportersLoading: reportersLoading,
    isDeliverablesLoading: deliverablesLoading
  };
  


  // Return the data object - memoized to prevent unnecessary re-renders
  const baseData = useMemo(() => ({
    // Task mutations - available to all users
    createTask,
    updateTask,
    deleteTask,
    
    // Common data
    reporters: reporters || [],
    deliverables: deliverablesData?.deliverables || [],
    tasks: tasksData || [],
    isLoading,
    loadingStates,
    error,
    
    // Month data (with selection support) - with safety checks
    monthId: monthId || null,
    monthName: monthName || null,
    daysInMonth: daysInMonth || null,
    startDate: startDate ? normalizeTimestamp(startDate) : null,
    endDate: endDate ? normalizeTimestamp(endDate) : null,
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
    
  }), [
    createTask, updateTask, deleteTask,
    reporters, deliverablesData?.deliverables, tasksData,
    isLoading, loadingStates, error,
    monthId, monthName, daysInMonth, startDate, endDate,
    boardExists, dropdownOptions,
    currentMonth, selectedMonth, isCurrentMonth,
    isInitialLoading, isMonthDataReady,
    selectMonth, resetToCurrentMonth
  ]);
  
  // Memoize the final return objects to prevent unnecessary re-renders
  const adminData = useMemo(() => ({
    ...baseData,
    // Admin gets everything
    user: userData.user, // Current user info from auth
    users: userData.allUsers || [], // All users for management
    isAdmin: true
  }), [baseData, userData.user, userData.allUsers]);

  const regularUserData = useMemo(() => ({
    ...baseData,
    // Regular user gets only their data
    user: userData.userData, // Their user data from database
    users: [], // Empty for regular users
    isAdmin: false
  }), [baseData, userData.userData]);

  if (userData.userIsAdmin) {
    return adminData;
  } else {
    return regularUserData;
  }
};
