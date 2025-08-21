import React, { useState } from 'react';
import { useAnalyticsFromRedux } from '../hooks/useAnalyticsFromRedux';
import { useSubscribeToMonthTasksQuery } from '../redux/services/tasksApi';
import { format } from 'date-fns';

/**
 * Example component demonstrating how to use the useAnalyticsFromRedux hook
 * with your Redux state structure
 */
const AnalyticsUsageExample = () => {
  const [monthId, setMonthId] = useState(format(new Date(), 'yyyy-MM'));
  const [analyticsResult, setAnalyticsResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to tasks for the current month (this populates Redux state)
  const { data: tasks = [], isLoading: tasksLoading } = useSubscribeToMonthTasksQuery({
    monthId,
  });

  // Use the analytics hook
  const {
    generateAnalyticsFromRedux,
    generateMultiMonthAnalyticsFromRedux,
    isComputing,
    getTasksFromRedux,
    hasTasksInRedux,
    getReduxCacheStatus,
    debugReduxCache
  } = useAnalyticsFromRedux();

  // Handle single month analytics generation
  const handleGenerateAnalytics = async () => {
    setIsLoading(true);
    try {
      console.log('=== Generating Analytics Example ===');
      
      // Check if tasks are in Redux cache
      const hasTasks = hasTasksInRedux(monthId);
      console.log(`Has tasks in Redux for ${monthId}:`, hasTasks);
      
      // Get cache status for debugging
      const cacheStatus = getReduxCacheStatus(monthId);
      console.log('Cache status:', cacheStatus);
      
      // Get tasks from Redux (if available)
      const tasksFromRedux = getTasksFromRedux(monthId);
      console.log(`Tasks from Redux for ${monthId}:`, tasksFromRedux?.length || 0);
      
      // Generate analytics from Redux state
      const result = await generateAnalyticsFromRedux(monthId, tasksFromRedux);
      setAnalyticsResult(result);
      
      console.log('Analytics generated successfully:', result);
    } catch (error) {
      console.error('Failed to generate analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle multi-month analytics generation
  const handleGenerateMultiMonthAnalytics = async () => {
    setIsLoading(true);
    try {
      const monthIds = [
        format(new Date(), 'yyyy-MM'),
        format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM'), // Previous month
      ];
      
      console.log('=== Generating Multi-Month Analytics Example ===');
      const results = await generateMultiMonthAnalyticsFromRedux(monthIds);
      setAnalyticsResult(results);
      
      console.log('Multi-month analytics generated:', results);
    } catch (error) {
      console.error('Failed to generate multi-month analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug Redux cache
  const handleDebugCache = () => {
    console.log('=== Debugging Redux Cache ===');
    debugReduxCache();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Analytics Usage Example</h1>
      
      {/* Month Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Month:</label>
        <input
          type="month"
          value={monthId}
          onChange={(e) => setMonthId(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Task Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Task Status</h3>
        <p>Tasks in Redux: {tasks.length}</p>
        <p>Tasks Loading: {tasksLoading ? 'Yes' : 'No'}</p>
        <p>Has Tasks in Cache: {hasTasksInRedux(monthId) ? 'Yes' : 'No'}</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 space-y-2">
        <button
          onClick={handleGenerateAnalytics}
          disabled={isLoading || isComputing}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading || isComputing ? 'Generating...' : 'Generate Analytics (Single Month)'}
        </button>
        
        <button
          onClick={handleGenerateMultiMonthAnalytics}
          disabled={isLoading || isComputing}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50 ml-2"
        >
          {isLoading || isComputing ? 'Generating...' : 'Generate Analytics (Multi-Month)'}
        </button>
        
        <button
          onClick={handleDebugCache}
          className="bg-gray-500 text-white px-4 py-2 rounded ml-2"
        >
          Debug Redux Cache
        </button>
      </div>

      {/* Results */}
      {analyticsResult && (
        <div className="mb-6 p-4 bg-green-50 rounded">
          <h3 className="font-semibold mb-2">Analytics Results</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(analyticsResult, null, 2)}
          </pre>
        </div>
      )}

      {/* Cache Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Cache Status</h3>
        <pre className="text-sm">
          {JSON.stringify(getReduxCacheStatus(monthId), null, 2)}
        </pre>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">How This Works</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>The component subscribes to tasks using <code>useSubscribeToMonthTasksQuery</code></li>
          <li>This populates the Redux state with task data</li>
          <li>The <code>useAnalyticsFromRedux</code> hook can access this cached data</li>
          <li>Analytics are generated from Redux state instead of Firebase reads</li>
          <li>This provides instant analytics generation with zero Firebase costs</li>
        </ol>
      </div>
    </div>
  );
};

export default AnalyticsUsageExample;
