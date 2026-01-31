/**
 * Months API (PERN stub – replace with backend endpoints when ready)
 */

import { useState, useEffect, useCallback } from 'react';
import { getMonthInfo } from '@/utils/monthUtils.jsx';
import { formatMonth } from '@/utils/dateUtils';
import { logger } from '@/utils/logger';

export const useCurrentMonth = (_userUID = null, _role = 'user', _userData = null) => {
  const [currentMonth, setCurrentMonth] = useState(null);
  const [boardExists, setBoardExists] = useState(false);
  const [currentMonthBoard, setCurrentMonthBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const info = getMonthInfo();
    setCurrentMonth(info);
    setBoardExists(false);
    setCurrentMonthBoard(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    currentMonth,
    boardExists,
    currentMonthBoard,
    isLoading,
    error,
  };
};

export const useAvailableMonths = () => {
  const [availableMonths, setAvailableMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const currentMonthInfo = getMonthInfo();
    const monthId = currentMonthInfo.monthId;
    const monthName = formatMonth(monthId);
    setAvailableMonths([
      {
        monthId,
        monthName,
        boardId: null,
        isCurrent: true,
        boardExists: false,
      },
    ]);
    setIsLoading(false);
    setError(null);
  }, []);

  return { availableMonths, isLoading, error };
};

export const useCreateMonthBoard = () => {
  const createMonthBoard = useCallback(async (monthId, userData) => {
    logger.warn('[monthsApi] createMonthBoard: backend not implemented');
    throw new Error('Month boards API not yet connected. Backend coming soon.');
  }, []);

  return [createMonthBoard];
};
