import { useGetSettingsTypeQuery } from '@/features/settings/settingsApi';
import { useMemo } from 'react';

export const useDeliverablesOptions = () => {
  const { data: deliverablesData, isLoading, error } = useGetSettingsTypeQuery({ settingsType: 'deliverables' });

  const deliverablesOptions = useMemo(() => {
    // Check if data exists and has the right structure
    if (!deliverablesData) {
      return [];
    }
    
    // Only use data from settings API - no hardcoded defaults
    if (!deliverablesData?.deliverables || deliverablesData.deliverables.length === 0) {
      return [];
    }

    // Transform database data to form options format
    const options = deliverablesData.deliverables.map(deliverable => ({
      value: deliverable.name,
      label: deliverable.name,
      timePerUnit: deliverable.timePerUnit,
      timeUnit: deliverable.timeUnit,
      requiresQuantity: deliverable.requiresQuantity,
      declinariTime: deliverable.declinariTime,
      declinariTimeUnit: deliverable.declinariTimeUnit || 'min'
    }));
    
    return options;
  }, [deliverablesData]);

  return {
    deliverablesOptions,
    isLoading,
    error
  };
};
