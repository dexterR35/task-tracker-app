import { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuth } from './useAuth';
import { 
  selectCurrentMonthId,
  selectCurrentMonthName,
  selectCurrentMonthStartDate,
  selectCurrentMonthEndDate,
  selectCurrentMonthDaysInMonth,
  selectBoardExists,
  selectCurrentMonthLoading,
  selectCurrentMonthGenerating,
  selectCurrentMonthError,
  initializeCurrentMonth,
  generateMonthBoard,
  setBoardExists,
  cleanupBoardListener
} from '../../features/currentMonth/currentMonthSlice';
import { logger } from '../utils/logger';
import { format } from 'date-fns';

/**
 * Automatically detects new month changes
 */
export const useCurrentMonth = () => {
  const dispatch = useDispatch();
  const { user, isAuthChecking } = useAuth();
  const lastMonthIdRef = useRef(null);
  
  // Get state from Redux store
  const monthId = useSelector(selectCurrentMonthId);
  const monthName = useSelector(selectCurrentMonthName);
  const startDate = useSelector(selectCurrentMonthStartDate);
  const endDate = useSelector(selectCurrentMonthEndDate);
  const daysInMonth = useSelector(selectCurrentMonthDaysInMonth);
  const boardExists = useSelector(selectBoardExists);
  const isLoading = useSelector(selectCurrentMonthLoading);
  const isGenerating = useSelector(selectCurrentMonthGenerating);
  const error = useSelector(selectCurrentMonthError);

  // Initialize current month when user is authenticated
  useEffect(() => {
    if (user && !isAuthChecking && !monthId) {
      logger.log('[useCurrentMonth] User authenticated, initializing current month');
      dispatch(initializeCurrentMonth());
    }
  }, [user, isAuthChecking, monthId, dispatch]);

  // Check for month changes 
  useEffect(() => {
    if (!monthId) return;

    // Get current month ID
    const currentMonthId = format(new Date(), 'yyyy-MM');
    
    // Check if month has changed
    if (monthId !== currentMonthId) {
      logger.log(`[useCurrentMonth] Month changed from ${monthId} to ${currentMonthId}, reinitializing`);
      
      // Clean up old month's listener before switching
      if (lastMonthIdRef.current) {
        cleanupBoardListener(lastMonthIdRef.current);
      }
      
      dispatch(initializeCurrentMonth());
    }
    
    // Store current month for next check
    lastMonthIdRef.current = monthId;
  }, [monthId, dispatch]);

  // Set board exists (for when admin creates board)
  const updateBoardExists = useCallback((exists) => {
    dispatch(setBoardExists(exists));
  }, [dispatch]);

  // Generate month board (admin only)
  const generateBoard = useCallback(async ({ monthId, meta = {} }) => {
    return dispatch(generateMonthBoard({ monthId, meta })).unwrap();
  }, [dispatch]);

  return {
    // State
    monthId,
    monthName,
    startDate,
    endDate,
    daysInMonth,
    boardExists,
    isLoading,
    isGenerating,
    error,
    
    // Actions
    updateBoardExists,
    generateBoard,
    
    // Computed
    isReady: !!monthId && !isLoading && !isGenerating,
    needsBoard: monthId && !boardExists,
    isNewMonth: lastMonthIdRef.current && monthId !== lastMonthIdRef.current
  };
};

export default useCurrentMonth;
