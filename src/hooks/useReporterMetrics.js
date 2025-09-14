import { useMemo } from 'react';
import { useDataFilter, useDataProcessor } from './useDataFilter';

/**
 * Hook to calculate reporter task counts with markets
 * @param {Array} tasks - Array of tasks from database
 * @param {Array} reporters - Array of reporters
 * @param {Object} filterOptions - Filter options for data
 * @returns {Array} Array of reporter names with task counts and markets
 */
export const useReportersTaskCount = (tasks = [], reporters = [], filterOptions = {}) => {
  // Use existing filter hook
  const filteredTasks = useDataFilter(tasks, filterOptions);

  // Calculate reporter task counts with markets
  const reporterTaskCounts = useMemo(() => {
    const counts = {};
    
    // Initialize all reporters with 0 tasks
    reporters.forEach(reporter => {
      counts[reporter.id] = {
        reporterName: reporter.name || reporter.reporterName || 'Unknown Reporter',
        taskCount: 0,
        marketCounts: {} // Count occurrences of each market
      };
    });

    // Count tasks for each reporter and collect market counts
    filteredTasks.forEach(task => {
      // Check both root level and data_task level for reporter ID
      const reporterId = task.reporters || task.data_task?.reporters;
      
      if (reporterId && counts[reporterId]) {
        counts[reporterId].taskCount++;
        
        // Count markets from task
        const taskMarkets = task.markets || task.data_task?.markets || [];
        if (Array.isArray(taskMarkets)) {
          taskMarkets.forEach(market => {
            if (market) {
              counts[reporterId].marketCounts[market] = 
                (counts[reporterId].marketCounts[market] || 0) + 1;
            }
          });
        }
      }
    });

    return Object.values(counts);
  }, [filteredTasks, reporters]);

  // Use existing processor hook
  return useDataProcessor(reporterTaskCounts, {
    filterFn: (reporter) => reporter.taskCount > 0,
    sortBy: 'taskCount',
    sortOrder: 'desc',
    mapFn: (reporter) => {
      // Format market counts with flexible design for different card types
      const marketEntries = Object.entries(reporter.marketCounts)
        .sort(([,a], [,b]) => b - a) // Sort by count descending
        .map(([market, count]) => {
          // Format as "count x market"
          if (count === 1) {
            return market; // Just show market name if count is 1
          } else {
            return `${count}x${market}`; // Format as "2x DK" (withno space)
          }
        })
        .join(' ');
      
      return {
        reporterName: reporter.reporterName,
        taskCount: reporter.taskCount,
        marketCounts: reporter.marketCounts,
        displayText: `${reporter.reporterName} - ${reporter.taskCount} task${reporter.taskCount !== 1 ? 's' : ''}`,
        marketsText: marketEntries || 'No markets',
        // Additional data for flexible card usage
        totalMarkets: Object.keys(reporter.marketCounts).length,
        totalMarketOccurrences: Object.values(reporter.marketCounts).reduce((sum, count) => sum + count, 0)
      };
    }
  });
};

/**
 * Hook for calculating reporter task metrics
 * @param {Array} tasks - Array of tasks from database
 * @param {Array} reporters - Array of reporters
 * @param {Object} filterOptions - Filter options for data
 * @returns {Object} Reporter metrics
 */
export const useReporterMetrics = (tasks = [], reporters = [], filterOptions = {}) => {
  // Use existing filter hook
  const filteredTasks = useDataFilter(tasks, filterOptions);
  
  // Use the new hook for reporter task counts
  const allReporterTasks = useReportersTaskCount(tasks, reporters, filterOptions);
  
  const metrics = useMemo(() => {
    const top3Reporters = allReporterTasks.slice(0, 3); // Get top 3 reporters
    
    const tasksWithReporters = filteredTasks.filter(task => 
      task.reporters || task.data_task?.reporters
    );
    
    const assignmentRate = filteredTasks.length > 0
      ? Math.round((tasksWithReporters.length / filteredTasks.length) * 100)
      : 0;

    return {
      reporterTaskList: top3Reporters, // Return only top 3
      allReporterTasks, // Keep all for reference if needed
      totalTasks: filteredTasks.length,
      totalReporters: reporters.length,
      activeReporters: allReporterTasks.length,
      tasksWithReporters: tasksWithReporters.length,
      assignmentRate,
      isFiltered: Object.keys(filterOptions).length > 0,
      filterOptions
    };
  }, [filteredTasks, allReporterTasks, reporters.length, filterOptions.userId, filterOptions.monthId]);

  return metrics;
};

export default useReporterMetrics;
