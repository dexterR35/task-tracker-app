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
import { getUserUID, isUserAdmin } from "@/features/utils/authUtils";
import { normalizeTimestamp, serializeTimestamps } from "@/utils/dateUtils";
import { logger } from '@/utils/logger';

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
  
  // Create context value - simplified without memoization
  logger.log('🔍 [AppDataProvider] Creating context value');
  
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
  
  // Selected month object
  const selectedMonth = selectedMonthId ? {
    monthId: selectedMonthId,
    monthName: availableMonths.find(m => m.monthId === selectedMonthId)?.monthName,
    isCurrent: false
  } : null;
  
  const isCurrentMonth = !selectedMonthId || selectedMonthId === monthId;
  
  const contextValue = {
    // Initialization state
    isInitialized,
    
    // User data
    user: userIsAdmin ? user : userData,
    users: userIsAdmin ? allUsers : [],
    isAdmin: userIsAdmin,
    
    // Common data - serialize timestamps for consistent API responses
    reporters: serializeTimestamps(reporters),
    deliverables: serializeTimestamps(deliverablesData || []),
    tasks: serializeTimestamps(tasksData || []),
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
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

export default AppDataContext;
