import React, { useMemo } from 'react';
import { useAppData } from '@/hooks/useAppData';

/**
 * Consolidated Deliverables Hooks
 * Combines all deliverables-related functionality into a single file
 */

/**
 * Get all deliverables from the database and transform them into form options
 */
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
      variationsTime: deliverable.variationsTime,
      variationsTimeUnit: deliverable.variationsTimeUnit || 'min'
    }));
    
    return options;
  }, [deliverables]);

  return {
    deliverablesOptions,
    isLoading,
    error
  };
};

/**
 * Filter deliverables by selected department
 */
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

/**
 * Calculate time estimates for deliverables with variations support
 */
export const useDeliverableCalculation = (deliverablesUsed, deliverablesOptions) => {
  return useMemo(() => {
    if (!deliverablesUsed || !Array.isArray(deliverablesUsed) || deliverablesUsed.length === 0) {
      return {
        deliverablesList: [],
        totalTime: 0,
        totalMinutes: 0,
        totalDays: 0
      };
    }

    const deliverablesList = [];
    let totalTime = 0;

    deliverablesUsed.forEach((deliverable, index) => {
      const deliverableName = deliverable?.name;
      const quantity = deliverable?.count || 1;
      
      // Safety check for deliverableName
      if (!deliverableName || typeof deliverableName !== 'string') {
        return;
      }
      
      // Find deliverable in settings with exact matching only
      const deliverableOption = deliverablesOptions ? deliverablesOptions.find(d => d.value === deliverableName) : null;
      
      if (deliverableOption) {
        // Calculate time for this deliverable
        const timePerUnit = deliverableOption.timePerUnit || 1;
        const timeUnit = deliverableOption.timeUnit || 'hr';
        const variationsTime = deliverableOption.variationsTime || deliverableOption.declinariTime || 0;
        const variationsTimeUnit = deliverableOption.variationsTimeUnit || deliverableOption.declinariTimeUnit || 'min';
        
        // Convert to hours
        let timeInHours = timePerUnit;
        if (timeUnit === 'min') timeInHours = timePerUnit / 60;
        if (timeUnit === 'days') timeInHours = timePerUnit * 8;
        
        // Add variations time if present
        let variationsTimeInHours = 0;
        if (variationsTime > 0) {
          if (variationsTimeUnit === 'min') variationsTimeInHours = variationsTime / 60;
          else if (variationsTimeUnit === 'hr') variationsTimeInHours = variationsTime;
          else if (variationsTimeUnit === 'days') variationsTimeInHours = variationsTime * 8;
          else variationsTimeInHours = variationsTime / 60; // Default to minutes
        }
        
        // Get variations quantity for this deliverable (if available in the data)
        const variationsQuantity = deliverable?.variationsQuantity || deliverable?.declinariQuantity || 0;
        const totalvariationsTime = variationsQuantity * variationsTimeInHours;
        const calculatedTime = (timeInHours * quantity) + totalvariationsTime;
        totalTime += calculatedTime;
        
        deliverablesList.push({
          name: deliverableName,
          quantity: quantity,
          time: calculatedTime,
          timePerUnit: timePerUnit,
          timeUnit: timeUnit,
          variationsTime: variationsTime,
          variationsTimeUnit: variationsTimeUnit,
          variationsQuantity: variationsQuantity,
          timeInHours: timeInHours,
          variationsTimeInHours: variationsTimeInHours,
          totalvariationsTime: totalvariationsTime,
          configured: true
        });
      } else {
        // If deliverable not found in settings, show warning
        deliverablesList.push({
          name: deliverableName,
          quantity: quantity,
          time: 0,
          timePerUnit: 0,
          timeUnit: 'hr',
          variationsTime: 0,
          variationsTimeUnit: 'min',
          timeInHours: 0,
          variationsTimeInHours: 0,
          notConfigured: true
        });
      }
    });

    return {
      deliverablesList,
      totalTime,
      totalMinutes: totalTime * 60,
      totalDays: totalTime / 8
    };
  }, [deliverablesUsed, deliverablesOptions]);
};

/**
 * Calculate single deliverable time with variations
 */
export const calculateSingleDeliverable = (deliverableOption, quantity = 1, variationsQuantity = 0) => {
  if (!deliverableOption) {
    return {
      time: 0,
      timeInHours: 0,
      variationsTimeInHours: 0,
      totalTime: 0,
      minutes: 0,
      days: 0
    };
  }

  const timePerUnit = deliverableOption.timePerUnit || 1;
  const timeUnit = deliverableOption.timeUnit || 'hr';
  const variationsTime = deliverableOption.variationsTime || deliverableOption.declinariTime || 0;
  const variationsTimeUnit = deliverableOption.variationsTimeUnit || deliverableOption.declinariTimeUnit || 'min';
  
  // Convert to hours
  let timeInHours = timePerUnit;
  if (timeUnit === 'min') timeInHours = timePerUnit / 60;
  if (timeUnit === 'days') timeInHours = timePerUnit * 8;
  
  // Add variations time if present
  let variationsTimeInHours = 0;
  if (variationsTime > 0) {
    if (variationsTimeUnit === 'min') variationsTimeInHours = variationsTime / 60;
    else if (variationsTimeUnit === 'hr') variationsTimeInHours = variationsTime;
    else if (variationsTimeUnit === 'days') variationsTimeInHours = variationsTime * 8;
    else variationsTimeInHours = variationsTime / 60; // Default to minutes
  }
  
  const totalvariationsTime = variationsQuantity * variationsTimeInHours;
  const totalTime = (timeInHours * quantity) + totalvariationsTime;
  
  return {
    time: totalTime,
    timeInHours,
    variationsTimeInHours,
    totalvariationsTime,
    totalTime,
    minutes: totalTime * 60,
    days: totalTime / 8,
    timePerUnit,
    timeUnit,
    variationsTime,
    variationsTimeUnit,
    variationsQuantity
  };
};

/**
 * Format deliverable display text
 */
export const formatDeliverableDisplay = (deliverable) => {
  if (!deliverable) return '';
  
  if (deliverable.notConfigured) {
    return '⚠️ Not configured in settings - Add to Settings → Deliverables';
  }
  
  // Calculate base time (without variations)
  const baseTime = deliverable.timeInHours * deliverable.quantity;
  
  if ((deliverable.variationsTime || deliverable.declinariTime) > 0) {
    const variationsTime = deliverable.variationsTime || deliverable.declinariTime;
    const variationsTimeUnit = deliverable.variationsTimeUnit || deliverable.declinariTimeUnit;
    const variationsHours = variationsTimeUnit === 'min' 
      ? variationsTime / 60 
      : variationsTimeUnit === 'hr' 
        ? variationsTime 
        : variationsTime * 8;
    
    return `${deliverable.timePerUnit}${deliverable.timeUnit} × ${deliverable.quantity} = ${baseTime.toFixed(1)}h + ${variationsHours.toFixed(3)}h variations = ${deliverable.time.toFixed(1)}h`;
  }
  
  return `${deliverable.timePerUnit}${deliverable.timeUnit} × ${deliverable.quantity} = ${baseTime.toFixed(1)}h`;
};

/**
 * Format variations display text
 */
export const formatvariationsDisplay = (variationsTime, variationsTimeUnit) => {
  if (!variationsTime || variationsTime <= 0) return '';
  
  const variationsHours = variationsTimeUnit === 'min' 
    ? variationsTime / 60 
    : variationsTimeUnit === 'hr' 
      ? variationsTime 
      : variationsTime * 8;
  
  return `+ ${variationsHours.toFixed(3)}h variations`;
};

/**
 * Format time breakdown for display
 */
export const formatTimeBreakdown = (totalTime) => {
  return {
    hours: totalTime.toFixed(1),
    minutes: (totalTime * 60).toFixed(0),
    days: (totalTime / 8).toFixed(2),
    summary: `Total: ${totalTime.toFixed(1)}hr = ${(totalTime * 60).toFixed(0)}min = ${(totalTime / 8).toFixed(2)}days`
  };
};

// ===== FORMATTED DELIVERABLE CALCULATION COMPONENT =====
const FormattedDeliverableCalculation = ({ 
  deliverablesUsed, 
  showDetailedCalculations = false, 
  className = "" 
}) => {
  const { deliverablesOptions = [] } = useDeliverablesOptions();
  const { deliverablesList } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);
  
  if (!deliverablesList || deliverablesList.length === 0) {
    return <span className={`text-gray-500 dark:text-gray-400 ${className}`}>No deliverables</span>;
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      {deliverablesList.map((deliverable, index) => (
        <div key={index} className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {deliverable.quantity}x{deliverable.name}
            {deliverable.variationsQuantity > 0 && (
              <span className="text-orange-600 dark:text-orange-400"> + {deliverable.variationsQuantity} variations</span>
            )}
          </div>
          
          {showDetailedCalculations && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {deliverable.configured ? (
                <div className="text-xs block">
                  <div className="block">
                    Base: {deliverable.timePerUnit}{deliverable.timeUnit} × {deliverable.quantity} = {deliverable.timeInHours * deliverable.quantity}h
                    {deliverable.timeUnit === 'min' && <span> ({deliverable.timeInHours * deliverable.quantity * 60}min)</span>}
                  </div>
                  {deliverable.variationsQuantity > 0 && (
                    <div className="block">
                      variations: {deliverable.variationsQuantity}x{deliverable.variationsTime}{deliverable.variationsTimeUnit} = {deliverable.totalvariationsTime}h
                      {deliverable.variationsTimeUnit === 'min' && <span> ({deliverable.totalvariationsTime * 60}min)</span>}
                    </div>
                  )}
                  <div className="block font-semibold text-yellow-600 dark:text-yellow-400">
                    Total: {deliverable.time}h ({deliverable.time / 8} day)
                  </div>
                </div>
              ) : deliverable.notConfigured ? (
                <span className="text-amber-600 dark:text-amber-400">⚠️ Not configured in settings - Add to Settings → Deliverables</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No time configuration</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ===== MAIN EXPORTS =====
export { FormattedDeliverableCalculation };
export { default as DeliverableTable } from './DeliverableTable';
export { default as DeliverableForm } from './DeliverableForm';
export { default as DeliverableFormModal } from './DeliverableFormModal';