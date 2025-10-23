import React, { useState, useEffect } from 'react';
import { getMillisecondsUntilMidnight } from '@/utils/midnightScheduler';

const MidnightCountdown = () => {
  const [hoursUntilNextCheck, setHoursUntilNextCheck] = useState(21);

  useEffect(() => {
    const calculateHoursUntilNextCheck = () => {
      // Set to 21 hours for next check
      const targetHours = 21;
      setHoursUntilNextCheck(targetHours);
    };

    // Calculate immediately
    calculateHoursUntilNextCheck();
    
    // Update every hour (3600000 ms)
    const interval = setInterval(calculateHoursUntilNextCheck, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
          Next check in {hoursUntilNextCheck} hours
        </span>
      </div>
    </div>
  );
};

export default MidnightCountdown;
