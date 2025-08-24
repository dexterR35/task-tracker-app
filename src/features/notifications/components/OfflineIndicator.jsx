import React from 'react';
import { useConnectionStatus } from '../../../shared/hooks/useOfflineStatus';

const OfflineIndicator = ({ className = "" }) => {
  const { 
    isOffline, 
    isFullyOnline, 
    hasSlowConnection, 
    connectionQuality,
    offlineDuration 
  } = useConnectionStatus();

  if (isFullyOnline && !hasSlowConnection) {
    return null; // Don't show anything when fully online
  }

  const getStatusColor = () => {
    if (isOffline) return 'bg-red-500';
    if (hasSlowConnection) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isOffline) {
      const minutes = Math.floor(offlineDuration / 60000);
      return `Offline${minutes > 0 ? ` (${minutes}m)` : ''}`;
    }
    if (hasSlowConnection) return 'Slow Connection';
    return 'Limited Connection';
  };

  const getStatusIcon = () => {
    if (isOffline) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
        </svg>
      );
    }
    if (hasSlowConnection) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg text-white ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
