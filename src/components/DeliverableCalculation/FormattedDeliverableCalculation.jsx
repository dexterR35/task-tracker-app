import React from 'react';
import { useDeliverableCalculation } from '@/hooks/useDeliverableCalculation';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';

/**
 * Formatted deliverable calculation component
 * Handles all formatting automatically
 */
const FormattedDeliverableCalculation = ({ 
  deliverablesUsed, 
  showDetailedCalculations = false,
  className = "",
  variant = "default" // "default", "detailed"
}) => {
  const { deliverablesOptions = [] } = useDeliverablesOptions();
  const { deliverablesList, totalTime, totalMinutes, totalDays } = useDeliverableCalculation(
    deliverablesUsed, 
    deliverablesOptions
  );
  
  // Format numbers automatically
  const formatTime = (time) => time.toFixed(1);
  const formatMinutes = (minutes) => minutes.toFixed(0);
  const formatDays = (days) => days.toFixed(2);
  
  if (!deliverablesList || deliverablesList.length === 0) {
    return <span className={`text-gray-500 dark:text-gray-400 ${className}`}>No deliverables</span>;
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      {deliverablesList.map((deliverable, index) => (
        <div key={index} className="text-sm">
          <div className="font-medium text-gray-900 dark:text-white">
            {deliverable.quantity}x{deliverable.name}
            {deliverable.declinariQuantity > 0 && (
              <span className="text-orange-600 dark:text-orange-400">
                {' '}+ {deliverable.declinariQuantity} declinari
              </span>
            )}
          </div>
          
          {showDetailedCalculations && (
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              {deliverable.configured ? (
                <div className="text-xs block">
                  <div className="block">
                    Base: {deliverable.timePerUnit}{deliverable.timeUnit} × {deliverable.quantity} = {formatTime(deliverable.timeInHours * deliverable.quantity)}h
                    {deliverable.timeUnit === 'min' && (
                      <span> ({formatMinutes(deliverable.timeInHours * deliverable.quantity * 60)}min)</span>
                    )}
                  </div>
                  {deliverable.declinariQuantity > 0 && (
                    <div className="block">
                      Declinari: {deliverable.declinariQuantity}x{deliverable.declinariTime}{deliverable.declinariTimeUnit} = {formatTime(deliverable.totalDeclinariTime)}h
                      {deliverable.declinariTimeUnit === 'min' && (
                        <span> ({formatMinutes(deliverable.totalDeclinariTime * 60)}min)</span>
                      )}
                    </div>
                  )}
                  <div className="block font-semibold text-yellow-600 dark:text-yellow-400">
                    Total: {formatTime(deliverable.time)}h ({formatDays(deliverable.time / 8)} day)
                  </div>
                </div>
              ) : deliverable.notConfigured ? (
                <span className="text-amber-600 dark:text-amber-400">
                  ⚠️ Not configured in settings - Add to Settings → Deliverables
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  No time configuration
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormattedDeliverableCalculation;
