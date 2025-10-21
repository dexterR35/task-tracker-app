import React, { useState, useEffect } from 'react';

// Simple fallback icons
const ChartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FirestoreUsageMonitor = () => {
  const [usage, setUsage] = useState({
    reads: 0,
    writes: 0,
    deletes: 0,
    total: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      // Listen for Firestore usage updates
      const handleUsageUpdate = (event) => {
        try {
          if (event.detail && event.detail.type === 'FIRESTORE_USAGE') {
            setUsage(event.detail.data);
          }
        } catch (err) {
          console.error('Error handling usage update:', err);
          setError('Failed to update usage data');
        }
      };

      window.addEventListener('firestore-usage', handleUsageUpdate);
      return () => window.removeEventListener('firestore-usage', handleUsageUpdate);
    } catch (err) {
      console.error('Error setting up usage monitor:', err);
      setError('Failed to initialize usage monitor');
    }
  }, []);

  const getUsageColor = (reads) => {
    if (reads < 1000) return 'text-green-500';
    if (reads < 5000) return 'text-yellow-500';
    if (reads < 50000) return 'text-orange-500';
    return 'text-red-500';
  };

  const getUsageStatus = (reads) => {
    if (reads < 1000) return 'Low';
    if (reads < 5000) return 'Medium';
    if (reads < 50000) return 'High';
    return 'Critical';
  };

  const getUsagePercentage = (reads) => {
    const freeTierLimit = 50000; // Firebase free tier limit
    return Math.min((reads / freeTierLimit) * 100, 100);
  };

  const handleManualSync = () => {
    setIsLoading(true);
    try {
      // You can manually set usage from Firebase dashboard data
      // Example: firestoreUsageTracker.setUsageFromDashboard({ reads: 56000, writes: 14, deletes: 3 });
      console.log('Manual sync requested - you can set usage from Firebase dashboard');
      setTimeout(() => setIsLoading(false), 1000);
    } catch (err) {
      console.error('Error in manual sync:', err);
      setIsLoading(false);
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-700 dark:text-red-300">
            Usage Monitor Error: {error}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <ChartIcon />
          <span className="font-semibold text-gray-900 dark:text-white">
            Firestore Usage
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-end">
            <span className={`text-sm font-medium ${getUsageColor(usage.reads)}`}>
              {usage.reads.toLocaleString()} reads
            </span>
            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  usage.reads < 1000 ? 'bg-green-500' :
                  usage.reads < 5000 ? 'bg-yellow-500' :
                  usage.reads < 50000 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${getUsagePercentage(usage.reads)}%` }}
              ></div>
            </div>
          </div>
          <ChevronDownIcon 
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Reads</span>
                <span className={`font-semibold ${getUsageColor(usage.reads)}`}>
                  {usage.reads.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Status: {getUsageStatus(usage.reads)}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Writes</span>
                <span className="font-semibold text-blue-500">
                  {usage.writes.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Operations</span>
              <span className="font-semibold text-purple-500">
                {usage.total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Free Tier Progress */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Free Tier Usage</span>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {getUsagePercentage(usage.reads).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  usage.reads < 50000 ? 'bg-blue-500' : 'bg-red-500'
                }`}
                style={{ width: `${getUsagePercentage(usage.reads)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400 mt-1">
              <span>0</span>
              <span>50K (Free Limit)</span>
            </div>
          </div>

          {/* Manual Sync Button */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Manual Sync</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sync with Firebase dashboard</p>
              </div>
              <button
                onClick={handleManualSync}
                disabled={isLoading}
                className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Syncing...' : 'Sync'}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Low: &lt;1K reads</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Medium: 1K-5K reads</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>High: 5K-50K reads</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Critical: &gt;50K reads (Exceeds Free Tier)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirestoreUsageMonitor;
