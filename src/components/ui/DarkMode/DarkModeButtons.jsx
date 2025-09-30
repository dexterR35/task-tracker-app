import { useDarkMode } from '@/context/DarkModeProvider';
import { Icons } from '@/components/icons';

const DarkModeToggle = () => {
  const { isDarkMode, isTransitioning, toggleDarkMode } = useDarkMode();

  const handleToggle = () => {
    if (!isTransitioning) {
      toggleDarkMode();
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isTransitioning}
      className={`
        relative inline-flex items-center justify-center w-10 h-10 rounded-full
        bg-gray-300 dark:bg-gray-700/50 hover:bg-gray-400 dark:hover:bg-gray-600
        ease-in-out transform hover:scale-105 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isTransitioning ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
      `}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Sun Icon */}
      <Icons.generic.sun
        className={`
          absolute w-6 h-6 text-yellow-500 transition-all duration-300 ease-in-out
          ${isDarkMode 
            ? 'opacity-0 rotate-90 scale-0' 
            : 'opacity-100 rotate-0 scale-100'
          }
        `}
      />
      
      {/* Moon Icon */}
      <Icons.generic.moon
        className={`
          absolute w-6 h-6 text-blue-400 transition-all duration-300 ease-in-out
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
