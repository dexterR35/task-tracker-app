import React from 'react';
import { useDarkMode } from '../../../context/DarkModeProvider';
import { Icons } from '../../icons';

const DarkModeToggle = () => {
  const { isDarkMode, isTransitioning, toggleDarkMode } = useDarkMode();

  return (
    <button
      onClick={toggleDarkMode}
      disabled={isTransitioning}
      className={`
        relative inline-flex items-center justify-center w-10 h-10 rounded-full
        bg-gray-300 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-700
        ease-in-out transform hover:scale-105
        focus:outline-none 
        ${isTransitioning ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
      `}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode (default)'}
    >
      {/* Sun Icon */}
      <Icons.generic.sun
        className={`
          absolute w-6 h-6 text-gray-800  ease-in-out
          ${isDarkMode 
            ? 'opacity-0 rotate-90 scale-0' 
            : 'opacity-100 rotate-0 scale-100'
          }
        `}
      />
      
      {/* Moon Icon */}
      <Icons.generic.moon
        className={`
          absolute w-6 h-6 text-blue-default  ease-in-out
          ${isDarkMode 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-0'
          }
        `}
      />
    </button>
  );
};

export default DarkModeToggle;
