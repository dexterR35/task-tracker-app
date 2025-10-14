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
            Calculation Formula
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p><strong>Base Formula:</strong> Total Time = (Base Time × Quantity) + variations Time</p>
            <p><strong>Work Day:</strong> 1 day = 8 hours (not 24 hours)</p>
            <p><strong>Time Conversion:</strong> Hours ÷ 8 = Days | Hours × 60 = Minutes</p>
            <p><strong>variations:</strong> Additional time added per task (if configured)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationFormula;
