import { useGetUsersQuery } from "@/features/users/usersApi";
import { useGetUserByUIDQuery } from "@/features/users/usersApi";
import { useGetReportersQuery } from "@/features/reporters/reportersApi";
import { useGetMonthTasksQuery } from "@/features/tasks/tasksApi";
import { useAuth } from "@/features/auth";
import { useMonthData } from "./useMonthData";
import { logger } from "@/utils/logger";
import { useState, useEffect } from "react";

/**
 * Unified hook for all app data
 * Automatically fetches the right data based on user role
 * - Admin users: get all users, all tasks, all reporters
 * - Regular users: get only their own data and tasks
 */
export const useAppData = () => {
  const { user } = useAuth();
  const { monthId, boardExists } = useMonthData();
  
  // Get the correct userUID
  const userUID = user?.userUID || user?.uid || user?.id;
  const isAdmin = user?.role === 'admin';
  
  // Debug logging
  logger.log('useAppData Debug:', {
    user,
    userUID,
    monthId,
    boardExists,
    isAdmin,
    hasUser: !!user,
    hasUserUID: !!userUID,
    hasMonthId: !!monthId
  });
  
  // Fetch user data (single user for regular users, all users for admin)
  const { 
    data: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useGetUserByUIDQuery(
    { userUID },
    { skip: !userUID || isAdmin } // Skip for admin users
  );
  
  // Fetch all users (admin only)
  const { 
    data: allUsers = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useGetUsersQuery(
    undefined,
    { skip: !isAdmin } // Only fetch for admin users
  );
  
  // Fetch all reporters (needed for task creation)
  const { 
    data: reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError 
  } = useGetReportersQuery();
  
  // Fetch tasks based on user role
  const { 
    data: tasksData = [], 
    isLoading: tasksLoading, 
    error: tasksError 
  } = useGetMonthTasksQuery(
    { 
      monthId: monthId || '', 
      userId: userUID || '', 
      role: isAdmin ? 'admin' : 'user' 
    },
    { skip: !userUID || !monthId }
  );

  // Debug API call
  logger.log('useGetMonthTasksQuery Debug:', {
    monthId,
    userId: userUID,
    role: isAdmin ? 'admin' : 'user',
    skip: !userUID || !monthId,
    tasksData: tasksData || [],
    tasksLoading,
    tasksError
  });
  
  const error = userError || usersError || reportersError || tasksError;
  
  // Simple loading state - just check if any API calls are loading
  const isLoading = userLoading || usersLoading || reportersLoading || tasksLoading;
  
  // Final debug log with all data
  logger.log('useAppData Final State:', {
    isAdmin,
    monthId,
    isLoading,
    error,
    tasksCount: (tasksData || []).length,
    usersCount: (allUsers || []).length,
    reportersCount: (reporters || []).length
  });
  
  // Return data based on user role
  if (isAdmin) {
    return {
      // Admin gets everything
      user: user, // Current user info from auth
      users: allUsers || [], // All users for management
      reporters: reporters || [],
      tasks: tasksData || [],
      isLoading,
      error,
      monthId,
      isAdmin: true
    };
  } else {
    return {
      // Regular user gets only their data
      user: userData, // Their user data from database
      users: [], // Empty for regular users
      reporters: reporters || [],
      tasks: tasksData || [],
      isLoading,
      error,
      monthId,
      isAdmin: false
    };
  }
};
