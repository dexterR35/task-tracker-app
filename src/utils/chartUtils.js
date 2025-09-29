import { format, parseISO, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';

// Helper function to safely parse dates from various formats
const safeParseDate = (dateValue) => {
  if (!dateValue) return new Date();
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    try {
      return parseISO(dateValue);
    } catch (error) {
      return new Date();
    }
  }
  
  // If it's a Firestore Timestamp object
  if (dateValue.seconds) {
    return new Date(dateValue.seconds * 1000);
  }
  
  // If it has a toDate method (Firestore Timestamp)
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // Fallback to current date
  return new Date();
};

/**
 * Calculate daily hours from tasks for a given month
 * @param {Array} tasks - Array of task objects
 * @param {string} monthId - Month ID (e.g., "2024-01")
 * @returns {Array} Array of daily data points for chart
 */
export const calculateDailyHours = (tasks, monthId) => {
  if (!tasks || tasks.length === 0 || !monthId) {
    return generateEmptyChartData();
  }

  // Parse month ID to get start and end dates
  const [year, month] = monthId.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0); // Last day of month

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group tasks by day
  const dailyHours = {};
  
  tasks.forEach(task => {

    // Use startDate from data_task, fallback to createdAt
    const taskDate = task.data_task?.startDate ? 
      safeParseDate(task.data_task.startDate) : 
      (task.createdAt ? safeParseDate(task.createdAt) : new Date());
    
    // Check if task is within the month
    if (isWithinInterval(taskDate, { start: startDate, end: endDate })) {
      const dayKey = format(taskDate, 'yyyy-MM-dd');
      const hours = parseFloat(task.data_task?.timeInHours || task.data_task?.hours || 0);
      
      if (!dailyHours[dayKey]) {
        dailyHours[dayKey] = 0;
      }
      dailyHours[dayKey] += hours;
    }
  });

  // Convert to chart data format
  return daysInMonth.map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayName = format(day, 'EEE'); // Mon, Tue, etc.
    const dayNumber = format(day, 'd'); // 1, 2, 3, etc.
    
    return {
      name: dayName,
      day: dayNumber,
      value: Math.round((dailyHours[dayKey] || 0) * 10) / 10, // Round to 1 decimal
      fullDate: dayKey
    };
  });
};

/**
 * Calculate daily task count from tasks for a given month
 * @param {Array} tasks - Array of task objects
 * @param {string} monthId - Month ID (e.g., "2024-01")
 * @returns {Array} Array of daily data points for chart
 */
export const calculateDailyTasks = (tasks, monthId) => {
  if (!tasks || tasks.length === 0 || !monthId) {
    return generateEmptyChartData();
  }

  // Parse month ID to get start and end dates
  const [year, month] = monthId.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group tasks by day
  const dailyTasks = {};
  
  tasks.forEach(task => {

    // Use startDate from data_task, fallback to createdAt
    const taskDate = task.data_task?.startDate ? 
      safeParseDate(task.data_task.startDate) : 
      (task.createdAt ? safeParseDate(task.createdAt) : new Date());
    
    // Check if task is within the month
    if (isWithinInterval(taskDate, { start: startDate, end: endDate })) {
      const dayKey = format(taskDate, 'yyyy-MM-dd');
      
      if (!dailyTasks[dayKey]) {
        dailyTasks[dayKey] = 0;
      }
      dailyTasks[dayKey] += 1;
    }
  });

  // Convert to chart data format
  return daysInMonth.map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayName = format(day, 'EEE');
    const dayNumber = format(day, 'd');
    
    return {
      name: dayName,
      day: dayNumber,
      value: dailyTasks[dayKey] || 0,
      fullDate: dayKey
    };
  });
};

/**
 * Calculate daily AI hours from tasks for a given month
 * @param {Array} tasks - Array of task objects
 * @param {string} monthId - Month ID (e.g., "2024-01")
 * @returns {Array} Array of daily data points for chart
 */
export const calculateDailyAIHours = (tasks, monthId) => {
  if (!tasks || tasks.length === 0 || !monthId) {
    return generateEmptyChartData();
  }

  // Parse month ID to get start and end dates
  const [year, month] = monthId.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group AI tasks by day
  const dailyAIHours = {};
  
  tasks.forEach(task => {

    // Use startDate from data_task, fallback to createdAt
    const taskDate = task.data_task?.startDate ? 
      safeParseDate(task.data_task.startDate) : 
      (task.createdAt ? safeParseDate(task.createdAt) : new Date());
    
    // Check if task is within the month and has AI usage
    if (isWithinInterval(taskDate, { start: startDate, end: endDate })) {
      const hasAI = task.data_task?.aiModels?.length > 0 || 
                   task.data_task?.aiTime > 0 ||
                   task.data_task?._usedAIEnabled;
      
      if (hasAI) {
        const dayKey = format(taskDate, 'yyyy-MM-dd');
        const hours = parseFloat(task.data_task?.aiTime || task.data_task?.timeInHours || 0);
        
        if (!dailyAIHours[dayKey]) {
          dailyAIHours[dayKey] = 0;
        }
        dailyAIHours[dayKey] += hours;
      }
    }
  });

  // Convert to chart data format
  return daysInMonth.map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayName = format(day, 'EEE');
    const dayNumber = format(day, 'd');
    
    return {
      name: dayName,
      day: dayNumber,
      value: Math.round((dailyAIHours[dayKey] || 0) * 10) / 10,
      fullDate: dayKey
    };
  });
};

/**
 * Calculate daily metrics for department-specific tasks
 * @param {Array} tasks - Array of task objects
 * @param {string} monthId - Month ID (e.g., "2024-01")
 * @param {string} department - Department name (video, design, developer)
 * @returns {Array} Array of daily data points for chart
 */
export const calculateDailyDepartmentMetrics = (tasks, monthId, department) => {
  if (!tasks || tasks.length === 0 || !monthId || !department) {
    return generateEmptyChartData();
  }

  // Filter tasks by department
  const departmentTasks = tasks.filter(task => {
    const taskDepartment = task.data_task?.departments || task.data_task?.department;
    
    // Handle both array and string formats
    if (Array.isArray(taskDepartment)) {
      return taskDepartment.some(dept => dept && dept.toLowerCase() === department.toLowerCase());
    }
    
    return taskDepartment && taskDepartment.toLowerCase() === department.toLowerCase();
  });

  return calculateDailyHours(departmentTasks, monthId);
};

/**
 * Calculate daily metrics for reporter-specific tasks
 * @param {Array} tasks - Array of task objects
 * @param {string} monthId - Month ID (e.g., "2024-01")
 * @param {string} reporterId - Reporter ID
 * @returns {Array} Array of daily data points for chart
 */
export const calculateDailyReporterMetrics = (tasks, monthId, reporterId) => {
  if (!tasks || tasks.length === 0 || !monthId || !reporterId) {
    return generateEmptyChartData();
  }

  // Filter tasks by reporter
  const reporterTasks = tasks.filter(task => {
    const taskReporter = task.data_task?.reporters || task.reporters;
    return taskReporter === reporterId;
  });

  return calculateDailyHours(reporterTasks, monthId);
};

/**
 * Calculate daily task counts grouped by reporter
 * @param {Array} tasks - Array of task objects
 * @param {string} monthId - Month ID (e.g., "2024-01")
 * @returns {Array} Array of daily data points for chart
 */
export const calculateDailyTasksByReporter = (tasks, monthId) => {
  if (!tasks || tasks.length === 0 || !monthId) {
    return generateEmptyChartData();
  }

  // Parse month ID to get start and end dates
  const [year, month] = monthId.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group tasks by day and reporter
  const dailyReporterTasks = {};
  
  tasks.forEach(task => {
    // Use startDate from data_task, fallback to createdAt
    const taskDate = task.data_task?.startDate ? 
      safeParseDate(task.data_task.startDate) : 
      (task.createdAt ? safeParseDate(task.createdAt) : new Date());
    
    // Check if task is within the month
    if (isWithinInterval(taskDate, { start: startDate, end: endDate })) {
      const dayKey = format(taskDate, 'yyyy-MM-dd');
      const reporter = task.data_task?.reporters || task.reporters || 'Unknown';
      
      if (!dailyReporterTasks[dayKey]) {
        dailyReporterTasks[dayKey] = {};
      }
      
      if (!dailyReporterTasks[dayKey][reporter]) {
        dailyReporterTasks[dayKey][reporter] = 0;
      }
      
      dailyReporterTasks[dayKey][reporter] += 1;
    }
  });

  // Convert to chart data format - sum all reporters for each day
  return daysInMonth.map(day => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayName = format(day, 'EEE');
    const dayNumber = format(day, 'd');
    
    // Sum all reporter tasks for this day
    const totalTasks = Object.values(dailyReporterTasks[dayKey] || {}).reduce((sum, count) => sum + count, 0);
    
    return {
      name: dayName,
      day: dayNumber,
      value: totalTasks,
      fullDate: dayKey
    };
  });
};

/**
 * Generate empty chart data for a month
 * @param {string} monthId - Month ID (e.g., "2024-01")
 * @returns {Array} Array of empty daily data points
 */
export const generateEmptyChartData = (monthId) => {
  if (!monthId) {
    // Return a week's worth of empty data
    return [
      { name: "Mon", day: "1", value: 0, fullDate: "2024-01-01" },
      { name: "Tue", day: "2", value: 0, fullDate: "2024-01-02" },
      { name: "Wed", day: "3", value: 0, fullDate: "2024-01-03" },
      { name: "Thu", day: "4", value: 0, fullDate: "2024-01-04" },
      { name: "Fri", day: "5", value: 0, fullDate: "2024-01-05" },
      { name: "Sat", day: "6", value: 0, fullDate: "2024-01-06" },
      { name: "Sun", day: "7", value: 0, fullDate: "2024-01-07" }
    ];
  }

  // Parse month ID to get start and end dates
  const [year, month] = monthId.split('-');
  const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
  const endDate = new Date(parseInt(year), parseInt(month), 0);

  // Get all days in the month
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });
  
  return daysInMonth.map(day => {
    const dayName = format(day, 'EEE');
    const dayNumber = format(day, 'd');
    const dayKey = format(day, 'yyyy-MM-dd');
    
    return {
      name: dayName,
      day: dayNumber,
      value: 0,
      fullDate: dayKey
    };
  });
};

/**
 * Get chart color based on card type
 * @param {string} cardType - Type of card (tasks, reporters, department, etc.)
 * @param {string} color - Card color (green, blue, red, etc.)
 * @returns {string} Hex color code
 */
export const getChartColor = (cardType, color) => {
  // Use card color if available
  if (color) {
    switch (color) {
      case "green":
        return "#2fd181"; // green-success
      case "blue":
        return "#2a9df4"; // blue-default
      case "purple":
        return "#3d48c9"; // btn-primary
      case "red":
        return "#eb2743"; // red-error
      case "yellow":
        return "#f59e0b"; // warning
      case "pink":
        return "#ec4899"; // btn-secondary
      default:
        return "#6b7280"; // secondary
    }
  }

  // Fallback to card type
  switch (cardType) {
    case "tasks":
      return "#2fd181"; // green-success
    case "reporters":
      return "#3d48c9"; // btn-primary
    case "department":
      return "#eb2743"; // red-error
    case "users":
      return "#2a9df4"; // blue-default
    default:
      return "#6b7280"; // secondary
  }
};

/**
 * Get chart type based on card type
 * @param {string} cardType - Type of card
 * @returns {string} Chart type (area, bar, line)
 */
export const getChartType = (cardType) => {
  switch (cardType) {
    case "tasks":
      return "area";
    case "reporters":
      return "bar";
    case "department":
      return "area";
    case "users":
      return "bar";
    default:
      return "area";
  }
};
