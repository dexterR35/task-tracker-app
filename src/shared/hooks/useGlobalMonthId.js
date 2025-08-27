import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useFormat } from './useFormat';
import { useSubscribeToMonthBoardQuery } from '../../features/tasks/tasksApi';

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

  // Update month ID when a new board is generated
  const updateMonthId = useCallback((newMonthId) => {
    if (newMonthId && typeof newMonthId === 'string' && newMonthId !== monthId) {
      console.log(`[useGlobalMonthId] updateMonthId called with: ${newMonthId}, current: ${monthId}`);
      setMonthId(newMonthId);
    }
  }, [monthId]);

  // Auto-detect new month and switch to it (but don't generate board automatically)
  useEffect(() => {
    if (monthId !== currentMonthId) {
      setMonthId(currentMonthId);
    }
  }, [currentMonthId]); // Remove monthId from dependencies to prevent circular updates

  // Handle board status changes - if board exists for current month, stay on it
  useEffect(() => {
    if (currentBoard?.exists && currentBoard.monthId === monthId) {
      // Board exists for current month, keep it
      // console.log(`[useGlobalMonthId] Board exists for ${monthId}, keeping current month`);
    }
  }, [currentBoard?.exists, currentBoard?.monthId, monthId]);



  return {
    monthId,
    setMonthId: updateMonthId,
    currentMonthId,
    isNewMonth: monthId !== currentMonthId
  };
};

export default useGlobalMonthId;
