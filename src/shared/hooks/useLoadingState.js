import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Centralized loading state hook
 * Provides a consistent way to handle loading states across the application
 * Loading states are determined by RTK Query hooks and Redux state
 */
export const useLoadingState = () => {
  // Get loading states from Redux store
  const authLoading = useSelector(state => state.auth.isLoading);
  const authChecking = useSelector(state => state.auth.isAuthChecking);
  
  // Memoize the combined loading state
  const isLoading = useMemo(() => {
    return authLoading || authChecking;
  }, [authLoading, authChecking]);

  return {
    isLoading,
    authLoading,
    authChecking,
    // Helper methods
    isAnyLoading: isLoading,
    isAuthLoading: authLoading || authChecking,
  };
};

/**
 * Hook for component-specific loading states
 * Takes multiple loading states and combines them
 */
export const useComponentLoading = (loadingStates = []) => {
  return useMemo(() => {
    return loadingStates.some(state => state === true);
  }, [loadingStates]);
};
