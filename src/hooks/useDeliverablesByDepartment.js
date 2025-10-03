import { useMemo } from 'react';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';

export const useDeliverablesByDepartment = (selectedDepartment) => {
  const { deliverablesOptions, isLoading, error } = useDeliverablesOptions();

  const filteredDeliverables = useMemo(() => {
    if (!selectedDepartment || !deliverablesOptions || deliverablesOptions.length === 0) {
      return [];
    }

    // Filter deliverables by selected department
    return deliverablesOptions.filter(deliverable => 
      deliverable.department === selectedDepartment
    );
  }, [deliverablesOptions, selectedDepartment]);

  return {
    deliverablesOptions: filteredDeliverables,
    isLoading,
    error
  };
};
