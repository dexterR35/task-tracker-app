import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AdminPageHeader from '@/components/layout/AdminPageHeader';
import CacheDebugger from '@/components/ui/Debug/CacheDebugger';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import DynamicButton from '@/components/ui/Button/DynamicButton';

const DebugPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('redux');
  
  // Get Redux state for debugging - memoized selectors
  const authState = useSelector(state => state.auth) || {};
  const currentMonthState = useSelector(state => state.currentMonth) || {};
  const tasksApiState = useSelector(state => state.tasksApi) || {};
  const usersApiState = useSelector(state => state.usersApi) || {};
  const reportersApiState = useSelector(state => state.reportersApi) || {};

  // Memoize expensive calculations
  const dataSummary = useMemo(() => {
    const usersQuery = Object.values(usersApiState.queries || {}).find(q => q?.endpointName === 'getUsers');
    const reportersQuery = Object.values(reportersApiState.queries || {}).find(q => q?.endpointName === 'getReporters');
    const tasksQuery = Object.values(tasksApiState.queries || {}).find(q => q?.endpointName === 'subscribeToMonthTasks' && q?.data?.tasks);
    
    return {
      usersCount: usersQuery?.data?.length || 0,
      reportersCount: reportersQuery?.data?.length || 0,
      tasksCount: tasksQuery?.data?.tasks?.length || 0
    };
  }, [usersApiState.queries, reportersApiState.queries, tasksApiState.queries]);

  // Memoize cache entries calculation
  const cacheEntries = useMemo(() => {
    const entries = [];
    
    // Users API cache entries
    if (usersApiState?.queries) {
      Object.entries(usersApiState.queries).forEach(([key, value]) => {
        const isAllUsers = key.includes('getUsers') && !key.includes('getUserByUID');
        const isCurrentUser = key.includes('getUserByUID');
        
        entries.push({
          type: isAllUsers ? 'Users API (All)' : 'Users API (Current)',
          key,
          status: value?.status,
          timestamp: value?.startedTimeStamp,
          data: value?.data,
          role: isAllUsers ? 'Admin Only' : 'User Only',
          endpointName: value?.endpointName,
          isLoading: value?.isLoading,
          error: value?.error
        });
      });
    }
    
    // Reporters API cache entries
    if (reportersApiState?.queries) {
      Object.entries(reportersApiState.queries).forEach(([key, value]) => {
        entries.push({
          type: 'Reporters API',
          key,
          status: value?.status,
          timestamp: value?.startedTimeStamp,
          data: value?.data,
          role: 'Both Roles',
          endpointName: value?.endpointName,
          isLoading: value?.isLoading,
          error: value?.error
        });
      });
    }
    
    // Tasks API cache entries
    if (tasksApiState?.queries) {
      Object.entries(tasksApiState.queries).forEach(([key, value]) => {
        entries.push({
          type: 'Tasks API',
          key,
          status: value?.status,
          timestamp: value?.startedTimeStamp,
          data: value?.data,
          role: 'Both Roles (Filtered)',
          endpointName: value?.endpointName,
          isLoading: value?.isLoading,
          error: value?.error
        });
      });
    }
    
    return entries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [usersApiState.queries, reportersApiState.queries, tasksApiState.queries]);

  // Memoize performance metrics
  const performanceMetrics = useMemo(() => {
    if (!('performance' in window)) {
      return { error: 'Performance API not available' };
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const resources = performance.getEntriesByType('resource');
      
      return {
        // Navigation timing
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
        totalLoadTime: navigation?.loadEventEnd - navigation?.fetchStart,
        
        // Paint timing
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        
        // Resource timing
        totalResources: resources.length,
        fontResources: resources.filter(r => 
          r.name.includes('.woff') || r.name.includes('.woff2') || r.name.includes('.ttf')
        ).length,
        
        // Memory usage (if available)
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null,
        
        // Font loading
        fontsLoaded: document.fonts ? document.fonts.ready : false
      };
    } catch (error) {
      return { error: error.message };
    }
  }, []); // Only calculate once

  // Memoize utility functions
  const formatTime = useCallback((ms) => {
    if (!ms || isNaN(ms)) return 'N/A';
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  }, []);

  const getPerformanceGrade = useCallback((fcp) => {
    if (!fcp || isNaN(fcp)) return 'N/A';
    if (fcp < 1800) return '🟢 Good';
    if (fcp < 3000) return '🟡 Needs Improvement';
    return '🔴 Poor';
  }, []);

  const tabs = [
    { id: 'redux', label: 'Redux State', icon: '🔧' },
    { id: 'cache', label: 'Cache Monitor', icon: '💾' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'devtools', label: 'DevTools', icon: '🛠️' },
    { id: 'raw', label: 'Raw Data', icon: '📊' }
  ];

  const renderReduxDebugger = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔧 Redux State Monitor
        </h3>
        
        {/* Enhanced Redux State Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Auth State */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
              🔐 Auth State
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">User:</span> {authState.user?.name || 'Not logged in'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {authState.user?.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Role:</span> {authState.user?.role || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Auth Checking:</span> 
                <span className={`ml-1 ${authState.isAuthChecking ? 'text-yellow-600' : 'text-green-600'}`}>
                  {authState.isAuthChecking ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Error:</span> 
                <span className={`ml-1 ${authState.error ? 'text-red-600' : 'text-green-600'}`}>
                  {authState.error ? `❌ ${authState.error}` : '✅ None'}
                </span>
              </div>
            </div>
          </div>

          {/* Current Month State */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
              📅 Current Month
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Month ID:</span> {currentMonthState.monthId || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Month Name:</span> {currentMonthState.monthName || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Board Exists:</span> 
                <span className={`ml-1 ${currentMonthState.boardExists ? 'text-green-600' : 'text-red-600'}`}>
                  {currentMonthState.boardExists ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Loading:</span> 
                <span className={`ml-1 ${currentMonthState.isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                  {currentMonthState.isLoading ? '⏳ Yes' : '✅ No'}
                </span>
              </div>
            </div>
          </div>

          {/* API States Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
              🔌 API States
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Tasks API:</span> 
                <span className="ml-1 text-blue-600">
                  {Object.keys(tasksApiState.queries || {}).length} queries
                </span>
              </div>
              <div>
                <span className="font-medium">Users API:</span> 
                <span className="ml-1 text-blue-600">
                  {Object.keys(usersApiState.queries || {}).length} queries
                </span>
              </div>
              <div>
                <span className="font-medium">Reporters API:</span> 
                <span className="ml-1 text-blue-600">
                  {Object.keys(reportersApiState.queries || {}).length} queries
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-3">
            📊 Data Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  const usersQuery = Object.values(usersApiState.queries || {}).find(q => q?.endpointName === 'getUsers');
                  return usersQuery?.data?.length || 0;
                })()}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">👥 Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  const reportersQuery = Object.values(reportersApiState.queries || {}).find(q => q?.endpointName === 'getReporters');
                  return reportersQuery?.data?.length || 0;
                })()}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">📝 Reporters</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(() => {
                  const tasksQuery = Object.values(tasksApiState.queries || {}).find(q => q?.endpointName === 'subscribeToMonthTasks' && q?.data?.tasks);
                  return tasksQuery?.data?.tasks?.length || 0;
                })()}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">✅ Tasks</div>
            </div>
          </div>
        </div>

        {/* API Cache Info */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
            🔧 API Cache
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Users Queries</div>
              <div className="text-lg font-bold text-blue-600">
                {Object.keys(usersApiState.queries || {}).length}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reporters Queries</div>
              <div className="text-lg font-bold text-green-600">
                {Object.keys(reportersApiState.queries || {}).length}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tasks Queries</div>
              <div className="text-lg font-bold text-purple-600">
                {Object.keys(tasksApiState.queries || {}).length}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info - Query Keys */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
            🔍 Debug Info
          </h4>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Users Query Keys:</div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {Object.keys(usersApiState.queries || {}).join(', ') || 'None'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reporters Query Keys:</div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {Object.keys(reportersApiState.queries || {}).join(', ') || 'None'}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasks Query Keys:</div>
              <div className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                {Object.keys(tasksApiState.queries || {}).join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Last Checked Time */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">⏰ Last Checked</div>
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  {currentMonthState.lastChecked 
                    ? new Date(currentMonthState.lastChecked).toLocaleTimeString()
                    : 'Never checked'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Last Updated Time */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">🔄 Last Updated</div>
                <div className="text-lg font-bold text-gray-800 dark:text-white">
                  {currentMonthState.lastUpdated 
                    ? new Date(currentMonthState.lastUpdated).toLocaleTimeString()
                    : 'Never updated'
                  }
                </div>
              </div>
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                iconName="refresh"
              >
                Refresh
              </DynamicButton>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  const renderCacheDebugger = () => {
    // Get cache entries manually for better display
    const getCacheEntries = () => {
      const entries = [];
      
      // Users API cache entries
      if (usersApiState?.queries) {
        Object.entries(usersApiState.queries).forEach(([key, value]) => {
          const isAllUsers = key.includes('getUsers') && !key.includes('getUserByUID');
          const isCurrentUser = key.includes('getUserByUID');
          
          entries.push({
            type: isAllUsers ? 'Users API (All)' : 'Users API (Current)',
            key,
            status: value?.status,
            timestamp: value?.startedTimeStamp,
            data: value?.data,
            role: isAllUsers ? 'Admin Only' : 'User Only',
            endpointName: value?.endpointName,
            isLoading: value?.isLoading,
            error: value?.error
          });
        });
      }
      
      // Reporters API cache entries
      if (reportersApiState?.queries) {
        Object.entries(reportersApiState.queries).forEach(([key, value]) => {
          entries.push({
            type: 'Reporters API',
            key,
            status: value?.status,
            timestamp: value?.startedTimeStamp,
            data: value?.data,
            role: 'Both Roles',
            endpointName: value?.endpointName,
            isLoading: value?.isLoading,
            error: value?.error
          });
        });
      }
      
      // Tasks API cache entries
      if (tasksApiState?.queries) {
        Object.entries(tasksApiState.queries).forEach(([key, value]) => {
          entries.push({
            type: 'Tasks API',
            key,
            status: value?.status,
            timestamp: value?.startedTimeStamp,
            data: value?.data,
            role: 'Both Roles (Filtered)',
            endpointName: value?.endpointName,
            isLoading: value?.isLoading,
            error: value?.error
          });
        });
      }
      
      return entries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    };

    const cacheEntries = getCacheEntries();

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            💾 Cache Monitor
          </h3>
          
          {/* Cache Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                📊 Cache Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Total Entries:</span> 
                  <span className="ml-1 text-blue-600">{cacheEntries.length}</span>
                </div>
                <div>
                  <span className="font-medium">Users API:</span> 
                  <span className="ml-1 text-blue-600">
                    {Object.keys(usersApiState.queries || {}).length} queries
                  </span>
                </div>
                <div>
                  <span className="font-medium">Reporters API:</span> 
                  <span className="ml-1 text-blue-600">
                    {Object.keys(reportersApiState.queries || {}).length} queries
                  </span>
                </div>
                <div>
                  <span className="font-medium">Tasks API:</span> 
                  <span className="ml-1 text-blue-600">
                    {Object.keys(tasksApiState.queries || {}).length} queries
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <h4 className="text-md font-semibold text-green-800 dark:text-green-200 mb-2">
                ✅ Status Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">Fulfilled:</span> 
                  <span className="ml-1 text-green-600">
                    {cacheEntries.filter(e => e.status === 'fulfilled').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Pending:</span> 
                  <span className="ml-1 text-yellow-600">
                    {cacheEntries.filter(e => e.status === 'pending').length}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Rejected:</span> 
                  <span className="ml-1 text-red-600">
                    {cacheEntries.filter(e => e.status === 'rejected').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h4 className="text-md font-semibold text-purple-800 dark:text-purple-200 mb-2">
                🔄 Actions
              </h4>
              <div className="space-y-2">
                <DynamicButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log('Cache Entries:', cacheEntries);
                    alert('Cache entries logged to console');
                  }}
                  iconName="code"
                >
                  Log to Console
                </DynamicButton>
              </div>
            </div>
          </div>

          {/* Cache Entries */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-4">
              📋 Cache Entries ({cacheEntries.length})
            </h4>
            
            {cacheEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No cache entries found</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Try navigating to different pages or refreshing to populate the cache
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cacheEntries.map((entry, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">#{index + 1}</span>
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">{entry.type}</span>
                        {entry.endpointName && (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            ({entry.endpointName})
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.status === 'fulfilled' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        entry.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    
                    {entry.role && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                        Role: {entry.role}
                      </div>
                    )}
                    
                    <div className="text-gray-700 dark:text-gray-300 text-xs font-mono break-all mb-2">
                      {entry.key}
                    </div>
                    
                    {entry.timestamp && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                        Time: {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    )}
                    
                    {entry.data && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        Data: {typeof entry.data === 'object' ? 
                          JSON.stringify(entry.data).substring(0, 100) + '...' : 
                          entry.data
                        }
                      </div>
                    )}
                    
                    {entry.error && (
                      <div className="text-red-500 dark:text-red-400 text-xs mt-2">
                        Error: {entry.error.message || entry.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceMonitor = () => {
    // Collect performance metrics
    const getPerformanceMetrics = () => {
      if (!('performance' in window)) {
        return { error: 'Performance API not available' };
      }

      try {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource');
        
        return {
          // Navigation timing
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
          loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
          totalLoadTime: navigation?.loadEventEnd - navigation?.fetchStart,
          
          // Paint timing
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
          
          // Resource timing
          totalResources: resources.length,
          fontResources: resources.filter(r => 
            r.name.includes('.woff') || r.name.includes('.woff2') || r.name.includes('.ttf')
          ).length,
          
          // Memory usage (if available)
          memory: performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
          } : null,
          
          // Font loading
          fontsLoaded: document.fonts ? document.fonts.ready : false
        };
      } catch (error) {
        return { error: error.message };
      }
    };

    const metrics = getPerformanceMetrics();

    const formatTime = (ms) => {
      if (!ms || isNaN(ms)) return 'N/A';
      return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
    };

    const getPerformanceGrade = (fcp) => {
      if (!fcp || isNaN(fcp)) return 'N/A';
      if (fcp < 1800) return '🟢 Good';
      if (fcp < 3000) return '🟡 Needs Improvement';
      return '🔴 Poor';
    };

    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⚡ Performance Monitor
          </h3>
          
          {metrics.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">
                Error collecting performance metrics: {metrics.error}
              </p>
            </div>
          ) : (
            <>
              {/* Performance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-green-800 dark:text-green-200 mb-2">
                    🎯 Core Web Vitals
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">FCP:</span>
                      <span className={`font-mono ${metrics.firstContentfulPaint > 3000 ? 'text-red-500' : 'text-green-500'}`}>
                        {formatTime(metrics.firstContentfulPaint)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Grade:</span>
                      <span className="font-semibold">
                        {getPerformanceGrade(metrics.firstContentfulPaint)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">First Paint:</span>
                      <span className="font-mono">{formatTime(metrics.firstPaint)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    ⏱️ Load Times
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">DOM Ready:</span>
                      <span className="font-mono">{formatTime(metrics.domContentLoaded)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Load Complete:</span>
                      <span className="font-mono">{formatTime(metrics.loadComplete)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Total Load:</span>
                      <span className="font-mono">{formatTime(metrics.totalLoadTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    📦 Resources
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Total:</span>
                      <span className="font-mono">{metrics.totalResources || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fonts:</span>
                      <span className="font-mono">{metrics.fontResources || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fonts Loaded:</span>
                      <span className={metrics.fontsLoaded ? 'text-green-500' : 'text-yellow-500'}>
                        {metrics.fontsLoaded ? '✓' : '⏳'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              {metrics.memory && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
                    🧠 Memory Usage
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{metrics.memory.used}MB</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{metrics.memory.total}MB</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{metrics.memory.limit}MB</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Limit</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(metrics.memory.used / metrics.memory.limit) * 100}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {((metrics.memory.used / metrics.memory.limit) * 100).toFixed(1)}% of limit used
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
        </div>
      </div>
    );
  };

  const renderDevTools = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🛠️ Redux DevTools
        </h3>
        
        <div className="space-y-6">
          {/* Redux DevTools Extension Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-md font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🔌 Redux DevTools Extension
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Install the Redux DevTools browser extension for advanced debugging:
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Chrome:</strong> 
                <a 
                  href="https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Install Extension
                </a>
              </div>
              <div>
                <strong>Firefox:</strong> 
                <a 
                  href="https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Install Extension
                </a>
              </div>
            </div>
          </div>

          {/* DevTools Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
              📊 DevTools Status
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Extension Available:</span> 
                <span className={`ml-1 ${window.__REDUX_DEVTOOLS_EXTENSION__ ? 'text-green-600' : 'text-red-600'}`}>
                  {window.__REDUX_DEVTOOLS_EXTENSION__ ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Environment:</span> 
                <span className="ml-1 text-blue-600">
                  {process.env.NODE_ENV}
                </span>
              </div>
              <div>
                <span className="font-medium">Store Connected:</span> 
                <span className="ml-1 text-green-600">
                  ✅ Yes
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
              ⚡ Quick Actions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
                    window.__REDUX_DEVTOOLS_EXTENSION__.open();
                  } else {
                    alert('Redux DevTools Extension not installed');
                  }
                }}
                iconName="external-link"
              >
                Open DevTools
              </DynamicButton>
              <DynamicButton
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Current Redux State:', {
                    auth: authState,
                    currentMonth: currentMonthState,
                    tasksApi: tasksApiState,
                    usersApi: usersApiState,
                    reportersApi: reportersApiState
                  });
                  alert('Redux state logged to console');
                }}
                iconName="code"
              >
                Log State
              </DynamicButton>
            </div>
          </div>

          {/* Store Configuration */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3">
              ⚙️ Store Configuration
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Middleware:</span> 
                <span className="ml-1 text-blue-600">
                  RTK Query, Redux Toolkit
                </span>
              </div>
              <div>
                <span className="font-medium">Slices:</span> 
                <span className="ml-1 text-blue-600">
                  auth, currentMonth, tasksApi, usersApi, reportersApi
                </span>
              </div>
              <div>
                <span className="font-medium">DevTools:</span> 
                <span className="ml-1 text-green-600">
                  Enabled in development
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRawData = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📊 Raw Redux State
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Auth State
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Month State
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(currentMonthState, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tasks API State
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(tasksApiState, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Users API State
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(usersApiState, null, 2)}
            </pre>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reporters API State
            </h4>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(reportersApiState, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'redux':
        return renderReduxDebugger();
      case 'cache':
        return renderCacheDebugger();
      case 'performance':
        return renderPerformanceMonitor();
      case 'devtools':
        return renderDevTools();
      case 'raw':
        return renderRawData();
      default:
        return renderReduxDebugger();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Debug Tools
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive debugging and monitoring tools for administrators
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-300 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">Environment</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{process.env.NODE_ENV}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-300 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Current User:</span>
                <div className="text-gray-900 dark:text-white font-semibold">{user?.name || 'Unknown'} ({user?.email || 'No email'})</div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Environment:</span>
                <div className="text-gray-900 dark:text-white font-semibold">{process.env.NODE_ENV}</div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 font-medium">Last Updated:</span>
                <div className="text-gray-900 dark:text-white font-semibold">{new Date().toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-sm border border-gray-300 dark:border-gray-700">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700">
          {renderTabContent()}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-300 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            🚀 Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DynamicButton
              variant="outline"
              size="md"
              onClick={() => window.location.reload()}
              iconName="refresh"
              iconPosition="left"
              className="px-4"
            >
              Reload Page
            </DynamicButton>
            <DynamicButton
              variant="outline"
              size="md"
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              iconName="trash"
              iconPosition="left"
              className="px-4"
            >
              Clear Storage
            </DynamicButton>
            <DynamicButton
              variant="outline"
              size="md"
              onClick={() => {
                console.log('Redux State:', {
                  auth: authState,
                  currentMonth: currentMonthState,
                  tasksApi: tasksApiState,
                  usersApi: usersApiState,
                  reportersApi: reportersApiState
                });
                alert('Redux state logged to console');
              }}
              iconName="code"
              iconPosition="left"
              className="px-4"
            >
              Log to Console
            </DynamicButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;
