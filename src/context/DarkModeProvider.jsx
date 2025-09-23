import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

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
    // Check localStorage first, then default to dark mode
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to dark mode instead of system preference
    return true;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef(null);

  const toggleDarkMode = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsTransitioning(true);
    
    // Add transition class to body
    document.body.classList.add('transition-colors', 'duration-500');
    
    // Toggle dark mode
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Update body class
    if (newMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    
    // Remove transition class after animation (500ms to match CSS duration)
    timeoutRef.current = setTimeout(() => {
      document.body.classList.remove('transition-colors', 'duration-500');
      setIsTransitioning(false);
      timeoutRef.current = null;
    }, 500);
  };

  useEffect(() => {
    // Set initial dark mode
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, []);

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
