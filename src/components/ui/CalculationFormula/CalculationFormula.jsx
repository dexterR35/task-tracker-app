import React from 'react';

const CalculationFormula = ({ className = "" }) => {
  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-6 h-6 text-blue-600 dark:text-blue-400">📝</div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Deliverable Calculation Formula
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <div>
              <p><strong>Formula:</strong> Total Time = (Time per Unit × Quantity) + (Variations Time × Variations Quantity)</p>
              <p><strong>Work Day:</strong> 1 day = 8 hours = 480 minutes</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-3 rounded border">
              <p className="font-medium mb-2">📊 Examples:</p>
              <div className="space-y-1 text-xs">
                <p><strong>Example 1:</strong> 1min × 1 + 1min variations = 2min total</p>
                <p><strong>Example 2:</strong> 24hr × 10 + 10min variations = 241.7h (30.21 days)</p>
                <p><strong>Example 3:</strong> 2hr × 5 + 5hr variations = 15h (1.88 days)</p>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
              <p className="font-medium mb-1 text-green-800 dark:text-green-200">💡 How to Use:</p>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <p>1. <strong>Select Deliverable:</strong> Choose from available options</p>
                <p>2. <strong>Set Quantity:</strong> Enter how many units you need</p>
                <p>3. <strong>Enable Variations:</strong> Check if you need additional time</p>
                <p>4. <strong>Set Variations Quantity:</strong> Enter how many variations</p>
                <p>5. <strong>Total Calculated:</strong> System computes final time automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationFormula;
