import React from 'react';
import { Icons } from '@/components/icons';
import { CARD_SYSTEM } from '@/constants';

const CalculationExamples = ({ deliverables = [] }) => {
  
  // Use real deliverables data if available, otherwise show examples
  const getExamples = () => {
    if (deliverables && deliverables.length > 0) {
      // Take first 3 deliverables and create examples with example quantities
      return deliverables.slice(0, 3).map((deliverable, index) => ({
        deliverable: deliverable.name,
        timePerUnit: 1, // Always 1 per unit
        timeUnit: deliverable.timeUnit || 'hr',
        quantity: [2, 3, 4][index], // Example quantities: 2, 3, 4
        variationsTime: Math.max(deliverable.variationsTime || 10, 10), // Minimum 10 minutes
        variationsEnabled: true // Always show variations
      }));
    }
    
    // Fallback examples if no deliverables data
    return [
      {
        deliverable: "Video Edit",
        timePerUnit: 1,
        timeUnit: "hr",
        quantity: 3,
        variationsTime: 10,
        variationsEnabled: true
      },
      {
        deliverable: "Design Mockup",
        timePerUnit: 1,
        timeUnit: "hr",
        quantity: 2,
        variationsTime: 15,
        variationsEnabled: true
      },
      {
        deliverable: "Code Review",
        timePerUnit: 1,
        timeUnit: "days",
        quantity: 1,
        variationsTime: 10,
        variationsEnabled: true
      }
    ];
  };

  const examples = getExamples();

  // Color mapping for different deliverable types
  const getDeliverableColor = (deliverableName, index) => {
    const colors = ['blue', 'green', 'purple', 'amber', 'pink', 'crimson'];
    return colors[index % colors.length];
  };

  const getDeliverableIcon = (deliverableName, index) => {
    const icons = [Icons.generic.clock, Icons.generic.chart, Icons.generic.settings];
    return icons[index % icons.length];
  };


  const calculateTime = (timePerUnit, timeUnit, quantity) => {
    let totalMinutes = 0;
    
    // Convert to minutes based on time unit
    if (timeUnit === 'hr') {
      totalMinutes = timePerUnit * 60 * quantity;
    } else if (timeUnit === 'days') {
      // For job deliverables, 1 day = 8 hours (not 24)
      totalMinutes = timePerUnit * 8 * 60 * quantity;
    } else if (timeUnit === 'min') {
      totalMinutes = timePerUnit * quantity;
    }
    
    return totalMinutes;
  };

  const formatTime = (minutes) => {
    // Show actual time format: hours and minutes
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Time Calculation Examples
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Examples of how deliverable time calculations work with different units and variations
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {examples.map((example, index) => {
          const baseTime = calculateTime(example.timePerUnit, example.timeUnit, example.quantity);
          const variationsTime = example.variationsEnabled ? (example.variationsTime * example.quantity) : 0;
          const totalTime = baseTime + variationsTime;
          
          const cardColor = getDeliverableColor(example.deliverable, index);
          const cardColorHex = CARD_SYSTEM.COLOR_HEX_MAP[cardColor] || "#64748b";
          const cardIcon = getDeliverableIcon(example.deliverable, index);
          
          return (
            <div key={index} className="card-small p-3">
              <div className="h-auto">
                <div className="flex flex-col h-full">
                  {/* Header with Icon in Top Left */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-3 rounded-lg flex items-center justify-center shadow-lg border border-gray-600/30"
                        style={{ backgroundColor: `${cardColorHex}20` }}
                      >
                        <cardIcon
                          className="w-5 h-5"
                          style={{ color: cardColorHex }}
                        />
                      </div>
                      <div className="leading-4">
                        <h4 className="text-sm font-bold text-gray-200 !mb-1">
                          {example.deliverable}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0">
                          {example.quantity} × 1 {example.timeUnit}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Value */}
                  <div className="mb-4">
                    <p className="text-2xl font-bold mb-1" style={{ color: cardColorHex }}>
                      {formatTime(totalTime)}
                    </p>
                    <p className="text-xs text-gray-400">Total Time</p>
                  </div>

                  {/* Calculation Details with Count Information */}
                  <div className="space-y-1">
                    <div 
                      className="p-2 rounded-lg border hover:bg-gray-700/30 transition-colors"
                      style={{ 
                        backgroundColor: `${cardColorHex}10`,
                        borderColor: `${cardColorHex}20`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2 h-2 rounded-full p-1"
                            style={{ 
                              backgroundColor: cardColorHex,
                              padding: '4px',
                              background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                            }}
                          ></div>
                          <span className="text-xs text-gray-400">Base Time</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {formatTime(baseTime)}
                        </span>
                      </div>
                      <div className="ml-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {example.quantity} × 1 {example.timeUnit} = {formatTime(baseTime)}
                        </span>
                        <div className="text-xs text-gray-400 mt-1">
                          {example.timeUnit === 'days' && `1 day = 8h (job hours)`}
                          {example.timeUnit === 'hr' && `1 hour = 1h`}
                          {example.timeUnit === 'min' && `1 min = 0.02h`}
                        </div>
                      </div>
                    </div>
                    
                    {example.variationsEnabled && (
                      <div 
                        className="p-2 rounded-lg border hover:bg-gray-700/30 transition-colors"
                        style={{ 
                          backgroundColor: `${cardColorHex}10`,
                          borderColor: `${cardColorHex}20`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full p-1"
                              style={{ 
                                backgroundColor: cardColorHex,
                                padding: '4px',
                                background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                              }}
                            ></div>
                            <span className="text-xs text-gray-400">variations Count</span>
                          </div>
                          <span className="text-sm font-medium text-gray-300">
                            {example.quantity}
                          </span>
                        </div>
                        <div className="ml-4 mt-1">
                          <span className="text-xs text-gray-500">
                            {example.quantity}×{example.variationsTime}min = +{formatTime(variationsTime)}
                          </span>
                          <div className="text-xs text-gray-400 mt-1">
                            {example.variationsTime} min = {(example.variationsTime / 60).toFixed(1)}h (min 10min/unit)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Hours Summary */}
                    <div 
                      className="p-2 rounded-lg border hover:bg-gray-700/30 transition-colors"
                      style={{ 
                        backgroundColor: `${cardColorHex}10`,
                        borderColor: `${cardColorHex}20`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2 h-2 rounded-full p-1"
                            style={{ 
                              backgroundColor: cardColorHex,
                              padding: '4px',
                              background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                            }}
                          ></div>
                          <span className="text-xs text-gray-400">Total Hours</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {formatTime(totalTime)}
                        </span>
                      </div>
                      <div className="ml-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTime(baseTime)} + {formatTime(variationsTime)} = {formatTime(totalTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> variations time is added to the base deliverable time when enabled in task form,. 
          Time units are automatically converted and displayed.
        </p>
      </div>
    </div>
  );
};

export default CalculationExamples;
