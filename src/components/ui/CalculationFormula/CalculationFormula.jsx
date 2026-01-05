import React from 'react';

const CalculationFormula = ({ className = "" }) => {
  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-4">
        Deliverable Calculation Formula
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Formula Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 text-blue-600 dark:text-blue-400">📝</div>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Formula
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p><strong>Formula:</strong> Total Time = (Time per Unit × Quantity) + (Variations Time × Variations Quantity)</p>
                <p><strong>Work Day:</strong> 1 day = 8 hours = 480 minutes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Examples Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="font-medium mb-2 text-gray-900 dark:text-gray-100">📊 Examples</p>
          <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
            <p><strong>Example 1:</strong> 1min × 1 + 1min variations = 2min total</p>
            <p><strong>Example 2:</strong> 24hr × 10 + 10min variations = 241.7h (30.21 days)</p>
            <p><strong>Example 3:</strong> 2hr × 5 + 5hr variations = 15h (1.88 days)</p>
          </div>
        </div>

        {/* How to Use Card */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="font-medium mb-1 text-green-800 dark:text-green-200">💡 How to Use</p>
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
  );
};

export default CalculationFormula;
