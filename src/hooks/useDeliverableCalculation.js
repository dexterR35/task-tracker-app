import { useMemo } from 'react';

/**
 * Centralized deliverable calculation hook
 * Handles all deliverable time calculations with variations support
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
