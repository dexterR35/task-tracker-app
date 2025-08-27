import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useFormat } from './useFormat';
import { useSubscribeToMonthBoardQuery } from '../../features/tasks/tasksApi';
import { logger } from '../utils/logger';

export const useGlobalMonthId = () => {
  const { user } = useAuth();
  const { getCurrentMonthId } = useFormat();
  
  // Get current month ID (always the latest)
  const currentMonthId = getCurrentMonthId();
  
  // Initialize with current month
  const [monthId, setMonthId] = useState(() => currentMonthId);
  
  // Check if current month board exists - using real-time subscription
  const { data: currentBoard } = useSubscribeToMonthBoardQuery(
    { monthId: monthId },
    { skip: !user }
  );

  // Check if we're in a new month (different from stored monthId)
  const isNewMonth = monthId !== currentMonthId;

  // Update month ID when a new board is generated
  const updateMonthId = useCallback((newMonthId) => {
    if (newMonthId && typeof newMonthId === 'string') {
      logger.debug(`[useGlobalMonthId] Updating global monthId from ${monthId} to ${newMonthId}`);
      setMonthId(newMonthId);
    }
  }, [monthId]);

  // Auto-detect new month and switch to it (but don't generate board automatically)
  useEffect(() => {
    if (isNewMonth) {
      logger.debug(`[useGlobalMonthId] New month detected! Switching from ${monthId} to ${currentMonthId}`);
      setMonthId(currentMonthId);
    }
  }, [isNewMonth, monthId, currentMonthId]);

  // Update month ID when board is generated via API
  useEffect(() => {
    if (currentBoard?.exists) {
      logger.debug(`[useGlobalMonthId] Board exists for ${monthId}, no need to switch`);
    }
  }, [currentBoard, monthId]);

  return {
    monthId,
    setMonthId: updateMonthId,
    currentMonthId,
    isNewMonth,
    needsBoardGeneration: !currentBoard?.exists
  };
};

export default useGlobalMonthId;
