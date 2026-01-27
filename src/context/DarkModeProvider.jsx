import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

export const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then default to light mode
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to light mode (white mode)
    return false;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef(null);

  // Helper function to update DOM classes - memoized to prevent unnecessary re-renders
  const updateDarkModeClasses = useCallback((darkMode) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.style.backgroundColor = '#181826';
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#ffffff';
      document.documentElement.style.colorScheme = 'light';
    }
  }, []);

  const toggleDarkMode = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsTransitioning(true);
    
    // Add transition class to body and documentElement
    document.body.classList.add('transition-colors', 'duration-500');
    document.documentElement.classList.add('transition-colors', 'duration-500');
    
    // Toggle dark mode
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Update both documentElement and body classes in real-time
    updateDarkModeClasses(newMode);
    
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    
    // Remove transition class after animation (500ms to match CSS duration)
    timeoutRef.current = setTimeout(() => {
      document.body.classList.remove('transition-colors', 'duration-500');
      document.documentElement.classList.remove('transition-colors', 'duration-500');
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 500);
  };

  // Sync DOM classes with state on mount and when isDarkMode changes
  useEffect(() => {
    updateDarkModeClasses(isDarkMode);
  }, [isDarkMode]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const value = {
    isDarkMode,
    isTransitioning,
    toggleDarkMode,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};
