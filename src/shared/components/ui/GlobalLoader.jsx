import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import Loader from './Loader';

const GlobalLoader = ({ children }) => {
  const { isLoading } = useAuth();

  // Show loader while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex-center">
        <Loader 
          size="xl" 
          text="Initializing application..." 
          variant="spinner"
        />
      </div>
    );
  }

  // Show children when auth is loaded
  return children;
};

export default GlobalLoader;
