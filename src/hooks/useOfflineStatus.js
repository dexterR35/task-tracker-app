import { useState, useEffect } from 'react';

/**
 * Custom hook to detect and manage offline status
 * Provides real-time offline/online state detection
 */
export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastOnline, setLastOnline] = useState(Date.now());

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnline(Date.now());
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline,
    lastOnline,
    offlineDuration: isOffline ? Date.now() - lastOnline : 0
  };
};

/**
 * Hook to detect network quality and connection status
 */
export const useNetworkStatus = () => {
  const [connection, setConnection] = useState({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });

  useEffect(() => {
    if (!navigator.connection) {
      return;
    }

    const updateConnectionInfo = () => {
      setConnection({
        effectiveType: navigator.connection.effectiveType || 'unknown',
        downlink: navigator.connection.downlink || 0,
        rtt: navigator.connection.rtt || 0,
        saveData: navigator.connection.saveData || false
      });
    };

    // Set initial connection info
    updateConnectionInfo();

    // Listen for connection changes
    navigator.connection.addEventListener('change', updateConnectionInfo);

    return () => {
      navigator.connection.removeEventListener('change', updateConnectionInfo);
    };
  }, []);

  return connection;
};

/**
 * Hook to detect Firebase connection status
 */
export const useFirebaseConnection = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastConnected, setLastConnected] = useState(Date.now());

  useEffect(() => {
    // This would need to be implemented with Firebase's connection state
    // For now, we'll use a simple approach
    const checkConnection = async () => {
      try {
        // Simple ping to check if we can reach Firebase
        const response = await fetch('https://firestore.googleapis.com/v1/projects/dummy', {
          method: 'HEAD',
          mode: 'no-cors'
        });
        setIsConnected(true);
        setLastConnected(Date.now());
      } catch (error) {
        setIsConnected(false);
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    lastConnected,
    disconnectedDuration: !isConnected ? Date.now() - lastConnected : 0
  };
};

/**
 * Combined hook for comprehensive connection status
 */
export const useConnectionStatus = () => {
  const offlineStatus = useOfflineStatus();
  const networkStatus = useNetworkStatus();
  const firebaseStatus = useFirebaseConnection();

  const isFullyOnline = offlineStatus.isOnline && firebaseStatus.isConnected;
  const hasSlowConnection = networkStatus.effectiveType === 'slow-2g' || networkStatus.effectiveType === '2g';

  return {
    ...offlineStatus,
    ...networkStatus,
    ...firebaseStatus,
    isFullyOnline,
    hasSlowConnection,
    connectionQuality: hasSlowConnection ? 'poor' : networkStatus.effectiveType === '4g' ? 'excellent' : 'good'
  };
};
