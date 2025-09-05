import React, { useState } from 'react';
import { useSelector } from 'react-redux';
// import { useCacheManagement } from '@/hooks/useCacheManagement';

/**
 * Debug component to visualize cache entries and manage cache
 * Only shows in development mode
 */
const CacheDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);

  
  // Get cache state from Redux store using direct property access
  const tasksApiState = useSelector(state => state.tasksApi);
  const usersApiState = useSelector(state => state.usersApi);
  const reportersApiState = useSelector(state => state.reportersApi);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getCacheEntries = () => {
    const entries = [];
    
    // Users API cache entries (Admin: all users, User: current user only)
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
          role: isAllUsers ? 'Admin Only' : 'User Only'
        });
      });
    }
    
    // Reporters API cache entries (Both roles)
    if (reportersApiState?.queries) {
      Object.entries(reportersApiState.queries).forEach(([key, value]) => {
        entries.push({
          type: 'Reporters API',
          key,
          status: value?.status,
          timestamp: value?.startedTimeStamp,
          data: value?.data,
          role: 'Both Roles'
        });
      });
    }
    
    // Tasks API cache entries (Both roles, filtered by user)
    if (tasksApiState?.queries) {
      Object.entries(tasksApiState.queries).forEach(([key, value]) => {
        entries.push({
          type: 'Tasks API',
          key,
          status: value?.status,
          timestamp: value?.startedTimeStamp,
          data: value?.data,
          role: 'Both Roles (Filtered)'
        });
      });
    }
    
    // Sort by timestamp to show execution order
    return entries.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  };

  const cacheEntries = getCacheEntries();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg"
      >
        Cache Debug ({cacheEntries.length})
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Cache Debugger</h3>
            <div className="space-x-2">
            
         \
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-4">
            {cacheEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">No cache entries</p>
            ) : (
              <div className="space-y-3">
                {cacheEntries.map((entry, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-purple-400 text-xs font-bold">#{index + 1}</span>
                        <span className="text-blue-400 text-xs font-medium">{entry.type}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        entry.status === 'fulfilled' ? 'bg-green-600 text-white' :
                        entry.status === 'pending' ? 'bg-yellow-600 text-white' :
                        entry.status === 'rejected' ? 'bg-red-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    {entry.role && (
                      <div className="text-gray-400 text-xs mb-1">
                        Role: {entry.role}
                      </div>
                    )}
                    <div className="text-gray-300 text-xs font-mono break-all">
                      {entry.key}
                    </div>
                    {entry.timestamp && (
                      <div className="text-gray-400 text-xs mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                    {entry.data && (
                      <div className="text-gray-400 text-xs mt-1">
                        Data: {typeof entry.data === 'object' ? JSON.stringify(entry.data).substring(0, 50) + '...' : entry.data}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheDebugger;
