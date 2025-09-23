/**
 * Centralized Month Utilities
 * Eliminates duplicate month logic across the application
 */

/**
 * Get current month information
 * @returns {Object} Month information with consistent structure
 */
export const getCurrentMonthInfo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // getMonth() returns 0-11, we want 1-12
  
  return {
    monthId: `${year}-${String(month).padStart(2, '0')}`,
    monthName: now.toLocaleString('default', { month: 'long' }),
    year: year,
    month: month,
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0), // Last day of current month
    daysInMonth: new Date(year, month, 0).getDate()
  };
};

/**
 * Generate month ID from date
 * @param {Date|string} date - Date object or date string
 * @returns {string} Month ID in format "YYYY-MM"
 */
export const generateMonthId = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * Get month boundaries for date restrictions
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {Object} Min and max date strings for the month
 */
export const getMonthBoundaries = (monthId) => {
  const [year, month] = monthId.split('-');
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  
  return {
    min: `${year}-${String(parseInt(month)).padStart(2, '0')}-01`,
    max: `${year}-${String(parseInt(month)).padStart(2, '0')}-${lastDay}`
  };
};

/**
 * Format month for display
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {string} Formatted month string
 */
export const formatMonthDisplay = (monthId) => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });
};

/**
 * Check if a date is within a specific month
 * @param {Date|string} date - Date to check
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {boolean} True if date is within the month
 */
export const isDateInMonth = (date, monthId) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const dateMonthId = generateMonthId(dateObj);
  return dateMonthId === monthId;
};

/**
 * Get month start and end dates as Date objects
 * @param {string} monthId - Month ID in format "YYYY-MM"
 * @returns {Object} Start and end dates
 */
export const getMonthDateRange = (monthId) => {
  const [year, month] = monthId.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);
  
  return {
    startDate,
    endDate,
    daysInMonth: endDate.getDate()
  };
};

/**
 * Validate month ID format
 * @param {string} monthId - Month ID to validate
 * @returns {boolean} True if valid format
 */
export const isValidMonthId = (monthId) => {
  const monthIdRegex = /^\d{4}-\d{2}$/;
  return monthIdRegex.test(monthId);
};

/**
 * Get previous month ID
 * @param {string} monthId - Current month ID
 * @returns {string} Previous month ID
 */
export const getPreviousMonthId = (monthId) => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return generateMonthId(date);
};

/**
 * Get next month ID
 * @param {string} monthId - Current month ID
 * @returns {string} Next month ID
 */
export const getNextMonthId = (monthId) => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  date.setMonth(date.getMonth() + 1);
  return generateMonthId(date);
};
