import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

const GlobalLoader = ({ children }) => {
  const { isLoading: authLoading, isAuthenticated, error: authError, isAuthChecking } = useAuth();

  // Only show loader when actively authenticating (login/logout in progress)
  // Don't show during initial auth state check for unauthenticated users
  const shouldShowAuthLoader = authLoading && !authError;

  if (shouldShowAuthLoader) {
    return (
      <div className="min-h-screen flex-center bg-primary" role="status" aria-busy="true">
        <div className="text-center">
          <Loader size="xl" text="Authenticating..." variant="spinner" />
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <div>Auth Loading: {authLoading ? '🔄' : '✅'}</div>
              <div>Auth Checking: {isAuthChecking ? '🔄' : '✅'}</div>
              <div>Auth Error: {authError ? '❌' : '✅'}</div>
              <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return children;
};

export default GlobalLoader;