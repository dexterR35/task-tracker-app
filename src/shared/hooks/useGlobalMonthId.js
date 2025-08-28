import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useFormat } from './useFormat';
import { logger } from '../utils/logger';

export const useGlobalMonthId = () => {
  const { user } = useAuth();
  const { getCurrentMonthId } = useFormat();
  
  // Get current month ID (always the latest)
  const currentMonthId = getCurrentMonthId();
  
  // Initialize with current month
  const [monthId, setMonthId] = useState(() => currentMonthId);

  // Update month ID when a new board is generated
  const updateMonthId = useCallback((newMonthId) => {
    if (newMonthId && typeof newMonthId === 'string') {
      logger.log(`[useGlobalMonthId] updateMonthId called with: ${newMonthId}, current: ${monthId}`);
      setMonthId(newMonthId);
    }
  }, []); // Remove monthId from dependencies to prevent circular updates

  // Auto-detect new month and switch to it (but don't generate board automatically)
  useEffect(() => {
    if (monthId !== currentMonthId) {
      setMonthId(currentMonthId);
    }
  }, [currentMonthId]); // Remove monthId from dependencies to prevent circular updates





  return {
    monthId,
    setMonthId: updateMonthId,
    currentMonthId,
    isNewMonth: monthId !== currentMonthId
  };
};

export default useGlobalMonthId;
