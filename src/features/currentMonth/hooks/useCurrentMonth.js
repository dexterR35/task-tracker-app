import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import { initializeCurrentMonth } from '../currentMonthSlice';
import { logger } from '../../../utils/logger';

/**
 * Hook for detecting month changes only
 * All data access should use Redux selectors directly
 */
export const useCurrentMonth = () => {
  const dispatch = useDispatch();
  const lastMonthIdRef = useRef(null);
  
  // Only get monthId for change detection
  const monthId = useSelector(state => state.currentMonth.monthId);
  
  // Get current month ID from system date
  const currentMonthId = format(new Date(), 'yyyy-MM');
  
  // Check for month changes
  useEffect(() => {
    if (!monthId) return;

    // Only check for month changes if we haven't already processed this month
    if (lastMonthIdRef.current === monthId) return;

    // Check if the month has actually changed
    if (monthId === currentMonthId) {
      // Store current month for next check (no change needed)
      lastMonthIdRef.current = monthId;
      return;
    }

    // Month has actually changed - log and reinitialize
    logger.log(`[useCurrentMonth] Month changed from ${monthId} to ${currentMonthId}, reinitializing`);
    
    // Reset tracking and reinitialize
    lastMonthIdRef.current = monthId;
    dispatch(initializeCurrentMonth());
    
  }, [monthId, currentMonthId, dispatch]);

  return {
    // Only return what's needed for month change detection
    monthId,
    currentMonthId,
    hasMonthChanged: lastMonthIdRef.current && monthId !== lastMonthIdRef.current
  };
};

export default useCurrentMonth;
