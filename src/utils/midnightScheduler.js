/**
 * Midnight-based scheduler utilities
 * Replaces unreliable setInterval with precise setTimeout targeting midnight
 */

/**
 * Calculate milliseconds until next midnight
 * @returns {number} Milliseconds until next midnight
 */
export const getMillisecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight
  return midnight.getTime() - now.getTime();
};

/**
 * Schedule a callback to run at the next midnight
 * @param {Function} callback - Function to call at midnight
 * @returns {number} Timeout ID for cancellation
 */
export const scheduleMidnightCallback = (callback) => {
  const msUntilMidnight = getMillisecondsUntilMidnight();
  
  return setTimeout(() => {
    // Execute the callback
    callback();
    
    // Schedule the next midnight callback (recursive)
    scheduleMidnightCallback(callback);
  }, msUntilMidnight);
};

/**
 * Check if the current date has changed since last check
 * @param {string} lastDate - Last checked date (YYYY-MM-DD format)
 * @returns {boolean} True if date has changed
 */
export const hasDateChanged = (lastDate) => {
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return lastDate !== currentDate;
};

/**
 * Get current date in YYYY-MM-DD format
 * @returns {string} Current date
 */
export const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Enhanced midnight scheduler with date change detection and alerts
 * @param {Function} onDateChange - Callback when date changes
 * @param {Function} onSchedule - Optional callback when scheduling
 * @param {Object} options - Additional options
 * @param {boolean} options.showAlert - Whether to show browser alert at midnight
 * @param {string} options.alertMessage - Custom alert message
 * @returns {Object} Scheduler control object
 */
export const createMidnightScheduler = (onDateChange, onSchedule = null, options = {}) => {
  const { showAlert = false, alertMessage = "It's midnight! New day has begun." } = options;
  let timeoutId = null;
  let lastCheckedDate = getCurrentDateString();
  
  const scheduleNext = () => {
    const msUntilMidnight = getMillisecondsUntilMidnight();
    
    if (onSchedule) {
      onSchedule(msUntilMidnight);
    }
    
    timeoutId = setTimeout(() => {
      const currentDate = getCurrentDateString();
      
      // Show alert at midnight if enabled
      if (showAlert) {
        // Alert message removed - use toast notifications instead
      }
      
      if (hasDateChanged(lastCheckedDate)) {
        lastCheckedDate = currentDate;
        onDateChange(currentDate);
      }
      
      // Schedule next check
      scheduleNext();
    }, msUntilMidnight);
  };
  
  const start = () => {
    scheduleNext();
  };
  
  const stop = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return {
    start,
    stop,
    isRunning: () => timeoutId !== null
  };
};

export default {
  getMillisecondsUntilMidnight,
  scheduleMidnightCallback,
  hasDateChanged,
  getCurrentDateString,
  createMidnightScheduler
};
