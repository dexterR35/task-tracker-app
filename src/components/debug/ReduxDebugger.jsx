import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { selectBoardExists } from '@/features/currentMonth';
import { useMonthData } from '@/hooks';

// Memoized selectors for ReduxDebugger - Fixed to access correct RTK Query keys
const selectUsersForDebug = createSelector(
  [(state) => state.usersApi.queries],
  (queries) => {
    // Find the getUsers query (it might be stored as 'getUsers(undefined)' or similar)
    const getUsersQuery = Object.values(queries).find(query => 
      query?.endpointName === 'getUsers'
    );
    return getUsersQuery?.data || [];
  }
);

const selectReportersForDebug = createSelector(
  [(state) => state.reportersApi.queries],
  (queries) => {
    // Find the getReporters query
    const getReportersQuery = Object.values(queries).find(query => 
      query?.endpointName === 'getReporters'
    );
    return getReportersQuery?.data || [];
  }
);

const selectTasksForDebug = createSelector(
  [(state) => state.tasksApi.queries],
  (queries) => {
    // Find any subscribeToMonthTasks query
    const tasksQuery = Object.values(queries).find(query => 
      query?.endpointName === 'subscribeToMonthTasks' && query?.data?.tasks
    );
    return tasksQuery?.data?.tasks || [];
  }
);

const selectLoadingStates = createSelector(
  [
    (state) => state.usersApi.queries,
    (state) => state.reportersApi.queries,
    (state) => state.tasksApi.queries
  ],
  (usersQueries, reportersQueries, tasksQueries) => {
    const getUsersQuery = Object.values(usersQueries).find(query => 
      query?.endpointName === 'getUsers'
    );
    const getReportersQuery = Object.values(reportersQueries).find(query => 
      query?.endpointName === 'getReporters'
    );
    const tasksQuery = Object.values(tasksQueries).find(query => 
      query?.endpointName === 'subscribeToMonthTasks'
    );
    
    return {
      users: getUsersQuery?.isLoading || false,
      reporters: getReportersQuery?.isLoading || false,
      tasks: tasksQuery?.isLoading || false
    };
  }
);

const selectErrorStates = createSelector(
  [
    (state) => state.usersApi.queries,
    (state) => state.reportersApi.queries,
    (state) => state.tasksApi.queries
  ],
  (usersQueries, reportersQueries, tasksQueries) => {
    const getUsersQuery = Object.values(usersQueries).find(query => 
      query?.endpointName === 'getUsers'
    );
    const getReportersQuery = Object.values(reportersQueries).find(query => 
      query?.endpointName === 'getReporters'
    );
    const tasksQuery = Object.values(tasksQueries).find(query => 
      query?.endpointName === 'subscribeToMonthTasks'
    );
    
    return {
      users: getUsersQuery?.error || null,
      reporters: getReportersQuery?.error || null,
      tasks: tasksQuery?.error || null
    };
  }
);

const selectApiCacheInfo = createSelector(
  [(state) => state.usersApi, (state) => state.reportersApi, (state) => state.tasksApi],
  (usersApi, reportersApi, tasksApi) => ({
    usersQueries: Object.keys(usersApi.queries || {}).length,
    reportersQueries: Object.keys(reportersApi.queries || {}).length,
    tasksQueries: Object.keys(tasksApi.queries || {}).length,
    usersQueryKeys: Object.keys(usersApi.queries || {}),
    reportersQueryKeys: Object.keys(reportersApi.queries || {}),
    tasksQueryKeys: Object.keys(tasksApi.queries || {})
  })
);

const ReduxDebugger = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get auth data using memoized selectors
  const user = useSelector(state => state.auth.user);
  const isAuthChecking = useSelector(state => state.auth.isAuthChecking);
  
  // Get month data from AppLayout context
  const { monthId, monthName, boardExists } = useMonthData();
  
  // Get data using memoized selectors
  const users = useSelector(selectUsersForDebug);
  const reporters = useSelector(selectReportersForDebug);
  const tasks = useSelector(selectTasksForDebug);
  const loading = useSelector(selectLoadingStates);
  const errors = useSelector(selectErrorStates);
  const apiCacheInfo = useSelector(selectApiCacheInfo);

  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-sm">
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            🔧 Redux Debug
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs space-y-2 text-gray-700 dark:text-gray-300">
            <div>
              <strong>👤 User:</strong> {user?.name || 'Not logged in'}
            </div>
            <div>
              <strong>📅 Month:</strong> {monthName || 'Not set'} ({monthId || 'No ID'})
            </div>
            <div>
              <strong>🏗️ Board:</strong> {boardExists ? '✅ Ready' : '❌ Not Ready'}
            </div>
            <div>
              <strong>⏰ Last Checked:</strong> {currentTime}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
              <strong>📊 Data Summary:</strong>
            </div>
            <div>
              <strong>👥 Users:</strong> {users.length} {loading.users && '⏳'}
            </div>
            <div>
              <strong>📝 Reporters:</strong> {reporters.length} {loading.reporters && '⏳'}
            </div>
            <div>
              <strong>✅ Tasks:</strong> {tasks.length} {loading.tasks && '⏳'}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
              <strong>🔧 API Cache:</strong>
            </div>
            <div>
              <strong>Users Queries:</strong> {apiCacheInfo.usersQueries}
            </div>
            <div>
              <strong>Reporters Queries:</strong> {apiCacheInfo.reportersQueries}
            </div>
            <div>
              <strong>Tasks Queries:</strong> {apiCacheInfo.tasksQueries}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
              <strong>🔍 Debug Info:</strong>
            </div>
            <div className="text-xs">
              <div><strong>Users Query Keys:</strong> {apiCacheInfo.usersQueryKeys.join(', ') || 'None'}</div>
              <div><strong>Reporters Query Keys:</strong> {apiCacheInfo.reportersQueryKeys.join(', ') || 'None'}</div>
              <div><strong>Tasks Query Keys:</strong> {apiCacheInfo.tasksQueryKeys.join(', ') || 'None'}</div>
            </div>
            
            {(errors.users || errors.reporters || errors.tasks) && (
              <div className="border-t border-red-200 dark:border-red-600 pt-2">
                <strong className="text-red-600 dark:text-red-400">❌ Errors:</strong>
                {errors.users && <div className="text-red-600 dark:text-red-400">Users: {errors.users.message}</div>}
                {errors.reporters && <div className="text-red-600 dark:text-red-400">Reporters: {errors.reporters.message}</div>}
                {errors.tasks && <div className="text-red-600 dark:text-red-400">Tasks: {errors.tasks.message}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReduxDebugger;
