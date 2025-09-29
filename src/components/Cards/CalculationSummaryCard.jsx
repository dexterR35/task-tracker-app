import React from 'react';
import { useDeliverablesOptions } from '@/hooks/useDeliverablesOptions';
import { calculateSingleDeliverable } from '@/hooks/useDeliverableCalculation';

const CalculationSummaryCard = () => {
  const { deliverablesOptions } = useDeliverablesOptions();

  // Get the first deliverable as an example
  const exampleDeliverable = deliverablesOptions?.[0];
  
  if (!exampleDeliverable) {
    return (
      <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <div className="w-5 h-5 text-blue-400">⚙️</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-200">Calculation Summary</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 text-gray-500 mx-auto mb-3">⚠️</div>
          <p className="text-gray-400">No deliverables configured</p>
          <p className="text-sm text-gray-500 mt-1">Add deliverables in Settings → Deliverables</p>
        </div>
      </div>
    );
  }

  // Calculate example with different quantities
  const example1 = calculateSingleDeliverable(exampleDeliverable, 1);
  const example2 = calculateSingleDeliverable(exampleDeliverable, 2);
  const example3 = calculateSingleDeliverable(exampleDeliverable, 5);

  return (
    <div className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-6 hover:bg-gray-800/70 transition-colors">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <div className="w-5 h-5 text-blue-400">⚙️</div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-200">Calculation Summary</h3>
          <p className="text-sm text-gray-400">Real data from your settings</p>
        </div>
      </div>

      {/* Example Deliverable Info */}
      <div className="mb-6 p-4 rounded-lg border border-gray-700/30 bg-blue-500/10">
        <h4 className="font-medium text-gray-200 mb-2">Example: {exampleDeliverable.label}</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <div><span className="font-medium">Time per Unit:</span> {exampleDeliverable.timePerUnit} {exampleDeliverable.timeUnit}</div>
          {exampleDeliverable.declinariTime > 0 && (
            <div><span className="font-medium">Declinari:</span> {exampleDeliverable.declinariTime} {exampleDeliverable.declinariTimeUnit}</div>
          )}
        </div>
      </div>

      {/* Calculation Examples */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-200">Calculation Examples:</h4>
        
        {/* Example 1: 1 unit */}
        <div className="p-3 rounded-lg border border-gray-700/30 bg-gray-800/30">
          <div className="text-sm font-medium text-gray-200 mb-2">1 Unit:</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div><span className="font-medium">Base:</span> {exampleDeliverable.timePerUnit}{exampleDeliverable.timeUnit} × 1 = {example1.timeInHours.toFixed(1)}h</div>
            {exampleDeliverable.declinariTime > 0 && (
              <div><span className="font-medium">Declinari:</span> {exampleDeliverable.declinariTime}{exampleDeliverable.declinariTimeUnit} = {example1.declinariTimeInHours.toFixed(3)}h</div>
            )}
            <div className="font-semibold text-blue-400">
              <span className="font-medium">Total:</span> {example1.time.toFixed(1)}h ({example1.minutes.toFixed(0)}min, {example1.days.toFixed(2)}days)
            </div>
          </div>
        </div>

        {/* Example 2: 2 units */}
        <div className="p-3 rounded-lg border border-gray-700/30 bg-gray-800/30">
          <div className="text-sm font-medium text-gray-200 mb-2">2 Units:</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div><span className="font-medium">Base:</span> {exampleDeliverable.timePerUnit}{exampleDeliverable.timeUnit} × 2 = {(example1.timeInHours * 2).toFixed(1)}h</div>
            {exampleDeliverable.declinariTime > 0 && (
              <div><span className="font-medium">Declinari:</span> {exampleDeliverable.declinariTime}{exampleDeliverable.declinariTimeUnit} = {example1.declinariTimeInHours.toFixed(3)}h</div>
            )}
            <div className="font-semibold text-blue-400">
              <span className="font-medium">Total:</span> {example2.time.toFixed(1)}h ({example2.minutes.toFixed(0)}min, {example2.days.toFixed(2)}days)
            </div>
          </div>
        </div>

        {/* Example 3: 5 units */}
        <div className="p-3 rounded-lg border border-gray-700/30 bg-gray-800/30">
          <div className="text-sm font-medium text-gray-200 mb-2">5 Units:</div>
          <div className="text-xs text-gray-300 space-y-1">
            <div><span className="font-medium">Base:</span> {exampleDeliverable.timePerUnit}{exampleDeliverable.timeUnit} × 5 = {(example1.timeInHours * 5).toFixed(1)}h</div>
            {exampleDeliverable.declinariTime > 0 && (
              <div><span className="font-medium">Declinari:</span> {exampleDeliverable.declinariTime}{exampleDeliverable.declinariTimeUnit} = {example1.declinariTimeInHours.toFixed(3)}h</div>
            )}
            <div className="font-semibold text-blue-400">
              <span className="font-medium">Total:</span> {example3.time.toFixed(1)}h ({example3.minutes.toFixed(0)}min, {example3.days.toFixed(2)}days)
            </div>
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="mt-6 p-4 rounded-lg border border-gray-700/30 bg-blue-500/10">
        <h4 className="font-medium text-gray-200 mb-2">Formula:</h4>
        <div className="text-sm text-gray-300">
          <div className="font-mono bg-gray-800/50 p-2 rounded">
            Total = (Base Time × Quantity) + Declinari Time
          </div>
          <div className="mt-2 text-xs text-gray-400">
            • Base time is multiplied by quantity<br/>
            • Declinari time is added once per task<br/>
            • Days calculated as 8 hours per day
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationSummaryCard;