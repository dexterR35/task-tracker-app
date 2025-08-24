import React, { useState } from 'react';
import { useCentralizedAnalytics } from '../hooks/useCentralizedAnalytics';
import OptimizedSmallCard from './ui/OptimizedSmallCard';
import { ANALYTICS_TYPES } from '../constants/analyticsTypes';
import { 
  ClipboardDocumentListIcon, 
  ClockIcon, 
  SparklesIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';

/**
 * Example component demonstrating centralized analytics usage
 */
const AnalyticsExample = ({ monthId, userId = null }) => {
  const [showDebug, setShowDebug] = useState(false);

  // Use the centralized analytics hook
  const {
    analytics,
    getMetric,
    getAllMetrics,
    hasData,
    isLoading,
    error,
    clearCache,
    getCacheStatus
  } = useCentralizedAnalytics(monthId, userId);

  // Get specific metrics
  const totalTasks = getMetric(ANALYTICS_TYPES.TOTAL_TASKS);
  const totalHours = getMetric(ANALYTICS_TYPES.TOTAL_HOURS);
  const aiTasks = getMetric(ANALYTICS_TYPES.AI_TASKS);
  const development = getMetric(ANALYTICS_TYPES.DEVELOPMENT);
  const design = getMetric(ANALYTICS_TYPES.DESIGN);
  const video = getMetric(ANALYTICS_TYPES.VIDEO);

  const handleClearCache = () => {
    clearCache();
    console.log('Cache cleared for month:', monthId);
  };

  const cacheStatus = getCacheStatus();

  if (!monthId) {
    return (
      <div className="text-center text-gray-300 py-8">
        Please select a month to view analytics
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-4">
        <h2 className="text-xl font-semibold text-gray-200">
          Centralized Analytics Example
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {showDebug ? 'Hide' : 'Show'} Debug
          </button>
          <button
            onClick={handleClearCache}
            className="px-3 py-2 text-sm bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
          >
            Clear Cache
          </button>
        </div>
      </div>

      {/* Debug Information */}
      {showDebug && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Month ID:</span>
              <span className="ml-2 text-gray-200">{monthId}</span>
            </div>
            <div>
              <span className="text-gray-400">User ID:</span>
              <span className="ml-2 text-gray-200">{userId || 'All Users'}</span>
            </div>
            <div>
              <span className="text-gray-400">Has Data:</span>
              <span className="ml-2 text-gray-200">{hasData ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Loading:</span>
              <span className="ml-2 text-gray-200">{isLoading ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Cached:</span>
              <span className="ml-2 text-gray-200">{cacheStatus.cached ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <span className="text-gray-400">Tasks Count:</span>
              <span className="ml-2 text-gray-200">{cacheStatus.tasksCount}</span>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-red-400">
              Error: {error.message || 'Unknown error'}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center text-gray-300 py-8">
          Loading analytics data...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-400 py-8">
          Error loading analytics: {error.message || 'Unknown error'}
        </div>
      )}

      {/* No Data State */}
      {!hasData && !isLoading && !error && (
        <div className="text-center text-gray-400 py-8">
          No analytics data available for this month
        </div>
      )}

      {/* Analytics Cards */}
      {hasData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Summary Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptimizedSmallCard
                title="Total Tasks"
                type={ANALYTICS_TYPES.TOTAL_TASKS}
                icon={ClipboardDocumentListIcon}
                monthId={monthId}
                userId={userId}
                analyticsData={totalTasks}
                trend={true}
                trendValue="This Month"
                trendDirection="up"
              />
              <OptimizedSmallCard
                title="Total Hours"
                type={ANALYTICS_TYPES.TOTAL_HOURS}
                icon={ClockIcon}
                monthId={monthId}
                userId={userId}
                analyticsData={totalHours}
                trend={true}
                trendValue="Total Time"
                trendDirection="up"
              />
              <OptimizedSmallCard
                title="AI Tasks"
                type={ANALYTICS_TYPES.AI_TASKS}
                icon={SparklesIcon}
                monthId={monthId}
                userId={userId}
                analyticsData={aiTasks}
                trend={true}
                trendValue="AI Usage"
                trendDirection="up"
              />
            </div>
          </div>

          {/* Category Cards */}
          <div>
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Category Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OptimizedSmallCard
                title="Development"
                type={ANALYTICS_TYPES.DEVELOPMENT}
                icon={CodeBracketIcon}
                monthId={monthId}
                userId={userId}
                analyticsData={development}
                trend={true}
                trendValue="Development"
                trendDirection="up"
              />
              <OptimizedSmallCard
                title="Design"
                type={ANALYTICS_TYPES.DESIGN}
                icon={PaintBrushIcon}
                monthId={monthId}
                userId={userId}
                analyticsData={design}
                trend={true}
                trendValue="Design Work"
                trendDirection="up"
              />
              <OptimizedSmallCard
                title="Video"
                type={ANALYTICS_TYPES.VIDEO}
                icon={VideoCameraIcon}
                monthId={monthId}
                userId={userId}
                analyticsData={video}
                trend={true}
                trendValue="Video Production"
                trendDirection="up"
              />
            </div>
          </div>

          {/* Analytics Summary */}
          {analytics && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Complete Analytics Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total Tasks:</span>
                  <span className="ml-2 text-gray-200">{analytics.summary?.totalTasks || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Hours:</span>
                  <span className="ml-2 text-gray-200">{analytics.summary?.totalHours || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">AI Tasks:</span>
                  <span className="ml-2 text-gray-200">{analytics.ai?.totalAITasks || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">AI Hours:</span>
                  <span className="ml-2 text-gray-200">{analytics.ai?.totalAIHours || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">Completion Rate:</span>
                  <span className="ml-2 text-gray-200">{analytics.summary?.completionRate || 0}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Hours/Task:</span>
                  <span className="ml-2 text-gray-200">{analytics.summary?.avgHoursPerTask || 0}</span>
                </div>
                <div>
                  <span className="text-gray-400">AI Percentage:</span>
                  <span className="ml-2 text-gray-200">{analytics.ai?.aiPercentage || 0}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Users:</span>
                  <span className="ml-2 text-gray-200">{analytics.performance?.totalUsers || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsExample;
