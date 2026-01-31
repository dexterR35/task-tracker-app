/**
 * Deliverables API (PERN stub – replace with backend endpoints when ready)
 */

import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';

export const useDeliverablesApi = () => {
  const [deliverables, setDeliverables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createDeliverable = useCallback(async () => {
    logger.warn('[useDeliverablesApi] createDeliverable: backend not implemented');
    throw new Error('Deliverables API not yet connected. Backend coming soon.');
  }, []);

  const updateDeliverable = useCallback(async () => {
    logger.warn('[useDeliverablesApi] updateDeliverable: backend not implemented');
    throw new Error('Deliverables API not yet connected. Backend coming soon.');
  }, []);

  const deleteDeliverable = useCallback(async () => {
    logger.warn('[useDeliverablesApi] deleteDeliverable: backend not implemented');
    throw new Error('Deliverables API not yet connected. Backend coming soon.');
  }, []);

  return {
    deliverables,
    isLoading,
    error,
    createDeliverable,
    updateDeliverable,
    deleteDeliverable,
  };
};
