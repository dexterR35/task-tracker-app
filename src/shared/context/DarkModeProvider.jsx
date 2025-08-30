import React, { createContext, useContext, useEffect, useState } from 'react';
import Loader from '../components/ui/Loader';

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
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleDarkMode = () => {
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
    
    // Remove transition class after animation (1 second)
    setTimeout(() => {
      document.body.classList.remove('transition-colors', 'duration-500');
      setIsTransitioning(false);
    }, 1200);
  };

  useEffect(() => {
    // Set initial dark mode
    if (isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
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
