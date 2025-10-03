import { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';

export const useDeliverablesOptions = () => {
  const { deliverables, isLoading, error } = useAppData();

  const deliverablesOptions = useMemo(() => {
    // Check if data exists and has the right structure
    if (!deliverables || deliverables.length === 0) {
      return [];
    }

    // Transform database data to form options format
    const options = deliverables.map(deliverable => ({
      value: deliverable.name,
      label: deliverable.name,
      department: deliverable.department,
      timePerUnit: deliverable.timePerUnit,
      timeUnit: deliverable.timeUnit,
      requiresQuantity: deliverable.requiresQuantity,
      declinariTime: deliverable.declinariTime,
      declinariTimeUnit: deliverable.declinariTimeUnit || 'min'
    }));
    
    return options;
  }, [deliverables]);

  return {
    deliverablesOptions,
    isLoading,
    error
  };
};
