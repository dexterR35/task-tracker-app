import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

const GlobalLoader = ({ children }) => {
  const { isLoading: authLoading, isAuthenticated, error: authError, isAuthChecking } = useAuth();
  
  // Track if we just completed auth to extend auth loading for initial queries
  const [justCompletedAuth, setJustCompletedAuth] = useState(false);
  const [authCompletedTime, setAuthCompletedTime] = useState(null);

  // Track when auth completes to extend loading for initial queries
  useEffect(() => {
    if (isAuthChecking && !authLoading) {
      // Auth just completed, extend loading for initial queries
      setJustCompletedAuth(true);
      setAuthCompletedTime(Date.now());
    } else if (isAuthChecking) {
      // Auth is still in progress
      setJustCompletedAuth(false);
      setAuthCompletedTime(null);
    }
  }, [isAuthChecking, authLoading]);

  // Clear the extended auth loading after 3 seconds or when queries complete
  useEffect(() => {
    if (justCompletedAuth && authCompletedTime) {
      const timer = setTimeout(() => {
        setJustCompletedAuth(false);
        setAuthCompletedTime(null);
      }, 3000); // Extend auth loading for 3 seconds after auth completes

      return () => clearTimeout(timer);
    }
  }, [justCompletedAuth, authCompletedTime]);

  // Show auth loader ONLY for authentication operations
  // Never show auth loader when user is authenticated (let DashboardLoader handle everything else)
  const shouldShowAuthLoader = (authLoading && isAuthChecking) || justCompletedAuth;
  const shouldShowLoader = shouldShowAuthLoader && !isAuthenticated;

  // Determine loading message
  let loadingMessage = "Authenticating...";
  let loadingType = "spinner";

  // Show loader only for authentication operations
  if (shouldShowLoader) {
    return (
      <div className="min-h-screen flex-center bg-primary">
        <div className="text-center">
          <Loader 
            size="xl" 
            text={loadingMessage} 
            variant={loadingType}
          />
          {/* Optional: Show loading details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <div>Auth Loading: {authLoading ? '🔄' : '✅'}</div>
              <div>Auth Checking: {isAuthChecking ? '🔄' : '✅'}</div>
              <div>Just Completed Auth: {justCompletedAuth ? '🔄' : '✅'}</div>
              <div>Auth Error: {authError ? '❌' : '✅'}</div>
              <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
              <div>Should Show Auth: {shouldShowAuthLoader ? '✅' : '❌'}</div>
              <div>Should Show Loader: {shouldShowLoader ? '✅' : '❌'}</div>
              <div>Message: {loadingMessage}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show children when no loading is needed
  return children;
};

export default GlobalLoader;
