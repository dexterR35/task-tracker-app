import { useMemo } from 'react';
import { useCurrentMonth } from './useCurrentMonth';
import { useFetchData } from './useFetchData';
import { logger } from '../utils/logger';

/**
 * Unified loading hook that consolidates data loading states
 * (month, dashboard data) after authentication is confirmed
 * 
 * @param {string|null} userId - Optional user filter
 * @param {boolean} isAuthenticated - Whether user is authenticated
 * @returns {Object} Unified loading state and data
 */
export const useUnifiedLoading = (userId = null, isAuthenticated = false) => {
  const { 
    monthId, 
    monthName,
    startDate,
    endDate,
    daysInMonth,
    boardExists,
    isLoading: monthLoading, 
    isGenerating,
    isReady: monthReady,
    generateBoard,
    isNewMonth
  } = useCurrentMonth();
  
  // Only fetch dashboard data when authenticated and month is ready
  const shouldFetchDashboard = isAuthenticated && monthReady;
  const dashboardData = useFetchData(
    shouldFetchDashboard ? userId : null
  );

  // Unified loading state calculation - only for data loading
  const unifiedLoading = useMemo(() => {
    // If not authenticated, don't show loading (router handles auth loading)
    if (!isAuthenticated) {
      return {
        isLoading: false,
        phase: 'not_authenticated',
        message: null,
        progress: 0
      };
    }

    // Phase 1: Month loading
    if (monthLoading || isGenerating) {
      return {
        isLoading: true,
        phase: 'month',
        message: monthLoading ? 'Loading current month...' : 'Generating board...',
        progress: 50
      };
    }

    // Phase 2: Month not ready
    if (!monthReady) {
      return {
        isLoading: true,
        phase: 'month_waiting',
        message: 'Preparing month data...',
        progress: 75
      };
    }

    // Phase 3: Dashboard data loading
    if (dashboardData.isLoading) {
      return {
        isLoading: true,
        phase: 'dashboard',
        message: 'Loading dashboard data...',
        progress: 90
      };
    }

    // Phase 4: All loaded
    return {
      isLoading: false,
      phase: 'complete',
      message: null,
      progress: 100
    };
  }, [
    isAuthenticated,
    monthLoading, 
    isGenerating, 
    monthReady, 
    dashboardData.isLoading
  ]);

  // Debug logging
  if (unifiedLoading.isLoading) {
    logger.log('[useUnifiedLoading] Loading phase:', {
      phase: unifiedLoading.phase,
      message: unifiedLoading.message,
      progress: unifiedLoading.progress,
      monthLoading,
      isGenerating,
      monthReady,
      dashboardLoading: dashboardData.isLoading
    });
  }

  return {
    // Unified loading state
    ...unifiedLoading,
    
    // Individual loading states (for debugging)
    monthLoading,
    isGenerating,
    dashboardLoading: dashboardData.isLoading,
    
    // Ready states
    monthReady,
    dashboardReady: !dashboardData.isLoading,
    
    // Data
    monthId,
    monthName,
    startDate,
    endDate,
    daysInMonth,
    boardExists,
    isNewMonth,
    generateBoard,
    dashboardData: shouldFetchDashboard ? dashboardData : null
  };
};

export default useUnifiedLoading;
