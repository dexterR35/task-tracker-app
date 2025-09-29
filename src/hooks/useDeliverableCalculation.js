import { useMemo } from 'react';
import { calculateDeliverableTime } from '@/features/tasks/config/useTaskForm';

/**
 * Centralized deliverable calculation hook
 * Handles all deliverable time calculations with declinari support
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
      
      // Find deliverable in settings with flexible matching
      let deliverableOption = deliverablesOptions ? deliverablesOptions.find(d => d.value === deliverableName) : null;
      
      // If exact match not found, try flexible matching
      if (!deliverableOption && deliverablesOptions) {
        // Try case-insensitive matching
        deliverableOption = deliverablesOptions.find(d => 
          d.value && d.value.toLowerCase() === deliverableName.toLowerCase()
        );
        
        // Try partial matching (e.g., "game preview" matches "game previews")
        if (!deliverableOption) {
          deliverableOption = deliverablesOptions.find(d => 
            d.value && (
              d.value.toLowerCase().includes(deliverableName.toLowerCase()) ||
              deliverableName.toLowerCase().includes(d.value.toLowerCase())
            )
          );
        }
      }
      
      if (deliverableOption) {
        // Calculate time for this deliverable
        const timePerUnit = deliverableOption.timePerUnit || 1;
        const timeUnit = deliverableOption.timeUnit || 'hr';
        const declinariTime = deliverableOption.declinariTime || 0;
        const declinariTimeUnit = deliverableOption.declinariTimeUnit || 'min';
        
        // Convert to hours
        let timeInHours = timePerUnit;
        if (timeUnit === 'min') timeInHours = timePerUnit / 60;
        if (timeUnit === 'days') timeInHours = timePerUnit * 8;
        
        // Add declinari time if present
        let declinariTimeInHours = 0;
        if (declinariTime > 0) {
          if (declinariTimeUnit === 'min') declinariTimeInHours = declinariTime / 60;
          else if (declinariTimeUnit === 'hr') declinariTimeInHours = declinariTime;
          else if (declinariTimeUnit === 'days') declinariTimeInHours = declinariTime * 8;
          else declinariTimeInHours = declinariTime / 60; // Default to minutes
        }
        
        const calculatedTime = (timeInHours + declinariTimeInHours) * quantity;
        totalTime += calculatedTime;
        
        deliverablesList.push({
          name: deliverableName,
          quantity: quantity,
          time: calculatedTime,
          timePerUnit: timePerUnit,
          timeUnit: timeUnit,
          declinariTime: declinariTime,
          declinariTimeUnit: declinariTimeUnit,
          timeInHours: timeInHours,
          declinariTimeInHours: declinariTimeInHours,
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
          declinariTime: 0,
          declinariTimeUnit: 'min',
          timeInHours: 0,
          declinariTimeInHours: 0,
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
 * Calculate single deliverable time with declinari
 */
export const calculateSingleDeliverable = (deliverableOption, quantity = 1) => {
  if (!deliverableOption) {
    return {
      time: 0,
      timeInHours: 0,
      declinariTimeInHours: 0,
      totalTime: 0,
      minutes: 0,
      days: 0
    };
  }

  const timePerUnit = deliverableOption.timePerUnit || 1;
  const timeUnit = deliverableOption.timeUnit || 'hr';
  const declinariTime = deliverableOption.declinariTime || 0;
  const declinariTimeUnit = deliverableOption.declinariTimeUnit || 'min';
  
  // Convert to hours
  let timeInHours = timePerUnit;
  if (timeUnit === 'min') timeInHours = timePerUnit / 60;
  if (timeUnit === 'days') timeInHours = timePerUnit * 8;
  
  // Add declinari time if present
  let declinariTimeInHours = 0;
  if (declinariTime > 0) {
    if (declinariTimeUnit === 'min') declinariTimeInHours = declinariTime / 60;
    else if (declinariTimeUnit === 'hr') declinariTimeInHours = declinariTime;
    else if (declinariTimeUnit === 'days') declinariTimeInHours = declinariTime * 8;
    else declinariTimeInHours = declinariTime / 60; // Default to minutes
  }
  
  const totalTime = (timeInHours + declinariTimeInHours) * quantity;
  
  return {
    time: totalTime,
    timeInHours,
    declinariTimeInHours,
    totalTime,
    minutes: totalTime * 60,
    days: totalTime / 8,
    timePerUnit,
    timeUnit,
    declinariTime,
    declinariTimeUnit
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
  
  const baseText = `${deliverable.timePerUnit}${deliverable.timeUnit} × ${deliverable.quantity} = ${deliverable.time.toFixed(1)}h`;
  
  if (deliverable.declinariTime > 0) {
    const declinariHours = deliverable.declinariTimeUnit === 'min' 
      ? deliverable.declinariTime / 60 
      : deliverable.declinariTimeUnit === 'hr' 
        ? deliverable.declinariTime 
        : deliverable.declinariTime * 8;
    
    return `${baseText} + ${declinariHours.toFixed(3)}h declinari`;
  }
  
  return baseText;
};

/**
 * Format declinari display text
 */
export const formatDeclinariDisplay = (declinariTime, declinariTimeUnit) => {
  if (!declinariTime || declinariTime <= 0) return '';
  
  const declinariHours = declinariTimeUnit === 'min' 
    ? declinariTime / 60 
    : declinariTimeUnit === 'hr' 
      ? declinariTime 
      : declinariTime * 8;
  
  return `+ ${declinariHours.toFixed(3)}h declinari`;
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
