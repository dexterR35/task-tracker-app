import { useMemo, useCallback } from "react";
import { useGetUsersQuery } from "@/features/users/usersApi";
import { useGetUserByUIDQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useGetMonthTasksQuery } from "@/features/tasks/tasksApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { 
  useGetCurrentMonthQuery
} from "@/features/tasks/tasksApi";
import { getUserUID, isUserAdmin } from "@/utils/authUtils";
import { createDebugLogger } from "@/utils/debugUtils";

// Split into focused hooks for better performance
export const useCurrentMonth = () => {
  const { 
    data: currentMonthData = {}, 
    isLoading: currentMonthLoading, 
    error: currentMonthError 
  } = useGetCurrentMonthQuery();
  
  return useMemo(() => {
    const { 
      currentMonth = {}, 
      availableMonths = [], 
      boardExists = false 
    } = currentMonthData;
    
    const { monthId, monthName, daysInMonth, startDate, endDate } = currentMonth;
    
    return {
      currentMonth,
      availableMonths,
      boardExists,
      monthId,
      monthName,
      daysInMonth,
      startDate,
      endDate,
      isLoading: currentMonthLoading,
      error: currentMonthError
    };
  }, [currentMonthData, currentMonthLoading, currentMonthError]);
};

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

export const useAppData = () => {
  const debug = createDebugLogger('useAppData');
  
  // Use focused hooks instead of inline logic
  const monthData = useCurrentMonth();
  const userData = useUserData();
  
  // Fetch all reporters (needed for task creation)
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError 
  } = useGetReportersQuery();
  
  // Fetch tasks based on user role - only when we have required data
  const shouldFetchTasks = userData.userUID && monthData.monthId;
  
  const { 
    data: tasksData = [], 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useGetMonthTasksQuery(
    { 
      monthId: monthData.monthId || '', 
      userId: userData.userIsAdmin ? undefined : userData.userUID,
      role: userData.userIsAdmin ? 'admin' : 'user',
      userData: userData.userIsAdmin ? userData.user : userData.userData
    },
    { skip: !shouldFetchTasks }
  );

  
  // Combine errors from all sources
  const error = userData.error || reportersError || tasksError || monthData.error;
  
  // Combined loading state
  const isLoading = userData.isLoading || reportersLoading || tasksLoading || monthData.isLoading;
  
  // Essential debug logging only (memoized)
  useMemo(() => {
    if (monthData.monthId && !isLoading && tasksData) {
      debug('App Data Loaded', { 
        monthId: monthData.monthId, 
        isAdmin: userData.userIsAdmin, 
        tasksCount: tasksData.length 
      });
    }
  }, [monthData.monthId, userData.userIsAdmin, tasksData, isLoading, debug]);
  
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
        
        // Month data
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
        
        // Month data
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
