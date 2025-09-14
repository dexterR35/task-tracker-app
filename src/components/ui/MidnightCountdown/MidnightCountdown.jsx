import React, { useState, useEffect } from 'react';
import { getMillisecondsUntilMidnight } from '@/utils/midnightScheduler';

const MidnightCountdown = () => {
  const [hoursUntilMidnight, setHoursUntilMidnight] = useState(0);

  useEffect(() => {
    const calculateHoursUntilMidnight = () => {
      const msUntilMidnight = getMillisecondsUntilMidnight();
      const hours = Math.round(msUntilMidnight / (1000 * 60 * 60));
      setHoursUntilMidnight(hours);
    };

    // Calculate immediately
    calculateHoursUntilMidnight();
    
    // Update every hour (3600000 ms)
    const interval = setInterval(calculateHoursUntilMidnight, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
          Next check in {hoursUntilMidnight} hours
        </span>
      </div>
    </div>
  );
};

export default MidnightCountdown;
