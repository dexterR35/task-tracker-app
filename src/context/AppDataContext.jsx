/**
 * App Data Context
 * Provides global app data to prevent duplicate API calls
 */

import React, { createContext, useContext, useMemo, useState } from 'react';
import { useUsers, useUserByUID } from "@/features/users/usersApi";
import { useReporters } from "@/features/reporters/reportersApi";
import { useDeliverablesApi } from '@/features/deliverables/useDeliverablesApi';
import { useTasks } from "@/features/tasks/tasksApi";
import { useCurrentMonth, useAvailableMonths } from "@/features/months/monthsApi";
import { useAuth } from "@/context/AuthContext";
import { getUserUID, isUserAdmin, hasPermission, isUserActive } from "@/features/utils/authUtils";
import { normalizeTimestamp, serializeTimestamps } from "@/utils/dateUtils";
import { logger } from '@/utils/logger';
import { AUTH } from '@/constants';

const AppDataContext = createContext();

export const useAppDataContext = (selectedUserId = null) => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppDataContext must be used within an AppDataProvider');
  }
  
  // If a specific selectedUserId is provided, use it, otherwise use the global one
  const effectiveSelectedUserId = selectedUserId !== null ? selectedUserId : context.selectedUserId;
  
  return {
    ...context,
    selectedUserId: effectiveSelectedUserId
  };
};

export const AppDataProvider = ({ children }) => {
  const [globalSelectedUserId, setGlobalSelectedUserId] = useState(null);
  const [selectedMonthId, setSelectedMonthId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get auth data
  const { user, isLoading: authLoading } = useAuth();
  const userUID = getUserUID(user);
  const userIsAdmin = isUserAdmin(user);
  
  // Initialize the provider once auth is ready
  React.useEffect(() => {
    if (!authLoading && user) {
      setIsInitialized(true);
    }
  }, [authLoading, user]);
  
  // Get user data - only fetch if not admin to reduce unnecessary calls
  const { 
    user: userData, 
    isLoading: userLoading, 
    error: userError 
  } = useUserByUID(userIsAdmin ? null : userUID);
  
  const { 
    users: allUsers = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useUsers();
  
  // Get month data
  const { 
    currentMonth: currentMonthData = {}, 
    boardExists,
    currentMonthBoard,
    isLoading: currentMonthLoading, 
    error: currentMonthError
  } = useCurrentMonth(
    userIsAdmin ? undefined : userUID,
    userIsAdmin ? 'admin' : 'user',
    user
  );
  
  const { 
    availableMonths = [], 
    isLoading: availableMonthsLoading
  } = useAvailableMonths();
  
  // Get other data
  const { 
    reporters = [], 
    isLoading: reportersLoading, 
    error: reportersError
  } = useReporters();
  
  const { deliverables: deliverablesData, isLoading: deliverablesLoading, error: deliverablesError } = useDeliverablesApi();
  
  // Get tasks data
  const currentMonthFromData = currentMonthData || {};
  const { monthId, monthName, daysInMonth, startDate, endDate } = currentMonthFromData;
  const targetMonthId = selectedMonthId || monthId;
  
  const { 
    tasks: tasksData = [], 
    isLoading: monthTasksLoading, 
    error: monthTasksError
  } = useTasks(
    targetMonthId,
    userIsAdmin ? 'admin' : 'user',
    userIsAdmin ? null : userUID
  );
  
  // Combine errors
  const errors = [userError, usersError, reportersError, deliverablesError, currentMonthError, monthTasksError];
  const error = errors.find(err => err) || null;
  
  // Combine loading states
  const isLoading = userLoading || usersLoading || currentMonthLoading || monthTasksLoading;
  const backgroundLoading = reportersLoading || deliverablesLoading || availableMonthsLoading;
  
  // Month selection functions
  const selectMonth = (newSelectedMonthId) => {
    setSelectedMonthId(newSelectedMonthId);
  };
  
  const resetToCurrentMonth = () => {
    setSelectedMonthId(null);
  };
  
  // Current month object
  const currentMonth = {
    monthId,
    monthName,
    daysInMonth,
    startDate: startDate ? normalizeTimestamp(startDate) : null,
    endDate: endDate ? normalizeTimestamp(endDate) : null,
    boardExists,
    isCurrent: true,
    isReady: monthId && monthName
  };
  
  // Selected month object - check if board exists by seeing if month is in availableMonths
  const selectedMonthData = selectedMonthId ? availableMonths.find(m => m.monthId === selectedMonthId) : null;
  const selectedMonth = selectedMonthId ? {
    monthId: selectedMonthId,
    monthName: selectedMonthData?.monthName,
    boardExists: selectedMonthData?.boardExists ?? !!selectedMonthData, // Use boardExists from availableMonths, fallback to existence check
    isCurrent: false
  } : null;
  
  const isCurrentMonth = !selectedMonthId || selectedMonthId === monthId;
  
  // Permission checking functions - Role-based instead of explicit permissions
  const canManageReporters = (userData) => {
    // If user has explicit permissions array, use it
    if (userData?.permissions && Array.isArray(userData.permissions)) {
      // Check for has_permission (universal admin permission) or admin role
      return userData.permissions.includes('has_permission') || userData.role === 'admin';
    }
    // Otherwise, use role-based permissions (admin can manage everything)
    return userData?.role === 'admin' && isUserActive(userData);
  };
  
  const canManageDeliverables = (userData) => {
    // If user has explicit permissions array, use it
    if (userData?.permissions && Array.isArray(userData.permissions)) {
      // Check for has_permission (universal admin permission) or admin role
      return userData.permissions.includes('has_permission') || userData.role === 'admin';
    }
    // Otherwise, use role-based permissions (admin can manage everything)
    return userData?.role === 'admin' && isUserActive(userData);
  };
  
  const canManageUsers = (userData) => {
    // If user has explicit permissions array, use it
    if (userData?.permissions && Array.isArray(userData.permissions)) {
      // Check for has_permission (universal admin permission) or admin role
      return userData.permissions.includes('has_permission') || userData.role === 'admin';
    }
    // Otherwise, use role-based permissions (admin can manage everything)
    return userData?.role === 'admin' && isUserActive(userData);
  };
  
  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    return {
      // Initialization state
      isInitialized,
      
      // User data
      user: userIsAdmin ? user : userData,
      // Allow all users to access users array for name resolution in analytics
      // User names are not sensitive data and are needed for proper display
      users: allUsers,
      isAdmin: userIsAdmin,
      
      // Common data - serialize timestamps for consistent API responses
      reporters: serializeTimestamps(reporters),
      deliverables: serializeTimestamps(deliverablesData || []),
      // Deduplicate tasks by ID to ensure uniqueness
      tasks: (() => {
        const serialized = serializeTimestamps(tasksData || []);
        // Deduplicate by task.id to ensure each task appears only once
        const uniqueTasksMap = new Map();
        serialized.forEach(task => {
          if (task && task.id) {
            if (!uniqueTasksMap.has(task.id)) {
              uniqueTasksMap.set(task.id, task);
            }
          }
        });
        return Array.from(uniqueTasksMap.values());
      })(),
      isLoading: isLoading || !isInitialized,
      backgroundLoading,
      error,
      
      // Month data
      monthId: monthId || null,
      monthName: monthName || null,
      daysInMonth: daysInMonth || null,
      startDate: startDate ? normalizeTimestamp(startDate) : null,
      endDate: endDate ? normalizeTimestamp(endDate) : null,
      boardExists: boardExists || false,
      availableMonths: serializeTimestamps(availableMonths || []),
      
      // Month selection
      currentMonth,
      selectedMonth,
      isCurrentMonth,
      isInitialLoading: currentMonthLoading && !monthId,
      isMonthDataReady: monthId && monthName,
      
      // Month selection functions
      selectMonth,
      resetToCurrentMonth,
      
      // Context specific
      selectedUserId: globalSelectedUserId,
      setSelectedUserId: setGlobalSelectedUserId,
      
      // Permission functions
      canManageReporters,
      canManageDeliverables,
      canManageUsers,
    };
  }, [
    // Only include essential dependencies that actually change
    isInitialized,
    userIsAdmin,
    user,
    userData,
    allUsers,
    reporters,
    deliverablesData,
    tasksData,
    isLoading,
    backgroundLoading,
    error,
    monthId,
    monthName,
    daysInMonth,
    startDate,
    endDate,
    boardExists,
    availableMonths,
    selectedMonthId, // Use selectedMonthId instead of derived objects
    currentMonthLoading,
    globalSelectedUserId
    // Removed: currentMonth, selectedMonth, isCurrentMonth, setGlobalSelectedUserId
    // These are derived values that don't need to be dependencies
  ]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;
