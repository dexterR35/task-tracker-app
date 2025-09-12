import React from 'react';
import { useGetCurrentMonthQuery } from '@/features/tasks/tasksApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { logger } from '@/utils/logger';

const MonthBoardDebugger = () => {
  const { user } = useAuth();
  const { data: monthData, isLoading, error, refetch } = useGetCurrentMonthQuery();

  const handleRefresh = async () => {
    try {
      logger.log('[MonthBoardDebugger] Manual refresh triggered');
      refetch();
      logger.log('[MonthBoardDebugger] Refresh completed');
    } catch (error) {
      logger.error('[MonthBoardDebugger] Refresh error:', error);
    }
  };

  const handleRefetch = () => {
    logger.log('[MonthBoardDebugger] Refetch triggered');
    refetch();
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Month Board Debugger</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {isLoading ? 'Loading...' : error ? 'Error' : 'Loaded'}
      </div>
      
      {monthData && (
        <div style={{ marginBottom: '10px' }}>
          <div><strong>Month ID:</strong> {monthData.currentMonth?.monthId}</div>
          <div><strong>Board Exists:</strong> {monthData.boardExists ? '✅ Yes' : '❌ No'}</div>
          <div><strong>Available Months:</strong> {monthData.availableMonths?.length || 0}</div>
          <div><strong>Last Updated:</strong> {new Date(monthData.lastUpdated).toLocaleTimeString()}</div>
        </div>
      )}
      
      {monthData?.availableMonths && monthData.availableMonths.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Available Months:</strong>
          <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
            {monthData.availableMonths.map(month => (
              <li key={month.monthId}>
                {month.monthId} - {month.boardId ? '✅' : '❌'}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleRefresh}
          disabled={isLoading}
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        
        <button 
          onClick={handleRefetch}
          disabled={isLoading}
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          {isLoading ? 'Refetching...' : 'Refetch Query'}
        </button>
      </div>
      
      {error && (
        <div style={{ marginTop: '10px', color: 'red', fontSize: '11px' }}>
          <strong>Error:</strong> {error.message || JSON.stringify(error)}
        </div>
      )}
    </div>
  );
};

export default MonthBoardDebugger;
