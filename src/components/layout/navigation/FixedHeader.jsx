import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Icons } from '@/components/icons';
import DarkModeToggle from '@/components/ui/DarkMode/DarkModeButtons';
import Avatar from '@/components/ui/Avatar';

const FixedHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, canAccess } = useAuth();
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return canAccess('admin') ? 'Task Management' : 'My Dashboard';
      case '/analytics':
        return 'Analytics';
      case '/users':
        return 'User Management';
      case '/debug':
        return 'Debug Console';
      default:
        return 'Dashboard';
    }
  };

  const getPageIcon = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return Icons.cards.home;
      case '/analytics':
        return Icons.cards.chart;
      case '/users':
        return Icons.admin.users;
      case '/debug':
        return Icons.admin.debug;
      default:
        return Icons.cards.home;
    }
  };

  const PageIcon = getPageIcon();

  return (
    <header className="relative z-40 backdrop-blur-md border-b border-gray-300/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between h-12 px-3 lg:px-4">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800  "
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Icons.buttons.menu className="w-4 h-4" />
          </button>

          {/* Page Title */}
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-blue-default/20 dark:bg-blue-default/30">
              <PageIcon className="w-4 h-4 text-blue-default dark:text-blue-default" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                {getPageTitle()}
              </h1>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* User Info */}
          <div className="hidden sm:flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800">
            <Avatar 
              user={user}
              gradient="from-blue-default to-btn-primary"
              size="sm"
              showName={false}
            />
            <div className="text-xs">
              <p className="font-medium text-gray-900 dark:text-white truncate max-w-24">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Dark Mode Toggle */}
          <div className="hidden sm:block">
            <DarkModeToggle />
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 "
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Icons.buttons.menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default FixedHeader;
