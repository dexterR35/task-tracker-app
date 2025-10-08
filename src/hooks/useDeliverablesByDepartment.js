import { useMemo } from 'react';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';

export const useDeliverablesByDepartment = (selectedDepartment) => {
  const { deliverablesOptions, isLoading, error } = useDeliverablesOptions();

  const filteredDeliverables = useMemo(() => {
    if (!selectedDepartment || !deliverablesOptions || deliverablesOptions.length === 0) {
      return [];
    }

    // Handle both array and string department formats
    const departmentToFilter = Array.isArray(selectedDepartment) 
      ? selectedDepartment[0] 
      : selectedDepartment;

    // Filter deliverables by selected department
    return deliverablesOptions.filter(deliverable => 
      deliverable.department === departmentToFilter
    );
  }, [deliverablesOptions, selectedDepartment]);

  return {
    deliverablesOptions: filteredDeliverables,
    isLoading,
    error
  };
};
