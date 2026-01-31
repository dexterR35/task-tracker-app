/**
 * Reporters API (PERN stub – replace with backend endpoints when ready)
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

export const useReporters = () => {
  const [reporters, setReporters] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setReporters([]);
    setIsLoading(false);
    setError(null);
  }, []);

  const createReporter = useCallback(async () => {
    logger.warn('[reportersApi] createReporter: backend not implemented');
    throw new Error('Reporters API not yet connected. Backend coming soon.');
  }, []);

  const updateReporter = useCallback(async () => {
    logger.warn('[reportersApi] updateReporter: backend not implemented');
    throw new Error('Reporters API not yet connected. Backend coming soon.');
  }, []);

  const deleteReporter = useCallback(async () => {
    logger.warn('[reportersApi] deleteReporter: backend not implemented');
    throw new Error('Reporters API not yet connected. Backend coming soon.');
  }, []);

  return {
    reporters,
    isLoading,
    error,
    createReporter,
    updateReporter,
    deleteReporter,
  };
};
