import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icons } from "@/components/icons";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import Avatar from "@/components/ui/Avatar/Avatar";

const FixedHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, canAccess } = useAuth();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case "/dashboard":
        return canAccess("admin") ? "Task Management" : "My Dashboard";
      case "/analytics":
        return "Analytics";
      case "/landing-pages":
        return "Landing Pages";
      case "/users":
        return "User Management";
      case "/documentation":
        return "Documentation";
      default:
        return "Dashboard";
    }
  };

  const getPageIcon = () => {
    const path = location.pathname;
    switch (path) {
      case "/dashboard":
        return Icons.cards.home;
      case "/analytics":
        return Icons.cards.chart;
      case "/landing-pages":
        return Icons.generic.document;
      case "/users":
        return Icons.admin.users;
      case "/documentation":
        return Icons.generic.document;
      default:
        return Icons.cards.home;
    }
  };

  const getPageColor = () => {
    const path = location.pathname;
    switch (path) {
      case "/dashboard":
        return "blue";
      case "/analytics":
        return "purple";
      case "/landing-pages":
        return "orange";
      case "/users":
        return "green";
      case "/documentation":
        return "indigo";
      default:
        return "blue";
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: "bg-blue-500 text-white shadow-lg shadow-blue-500/25",
      purple: "bg-purple-500 text-white shadow-lg shadow-purple-500/25",
      green: "bg-green-500 text-white shadow-lg shadow-green-500/25",
      orange: "bg-orange-500 text-white shadow-lg shadow-orange-500/25",
      indigo: "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25",
    };
    return colorMap[color] || colorMap.blue;
  };

  const PageIcon = getPageIcon();
  const pageColor = getPageColor();

  return (
    <div className="flex items-center justify-between h-full px-4 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Icons.buttons.menu className="w-5 h-5" />
        </button>

        {/* Page Title with Enhanced Design */}
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${getColorClasses(pageColor)} transition-all duration-200`}>
            <PageIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-105">
          <Icons.generic.clock className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Dark Mode Toggle */}
        <div className="hidden sm:block">
          <DarkModeToggle />
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {canAccess("admin") ? "Administrator" : "User"}
              </p>
            </div>
            <Icons.buttons.chevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Icons.generic.user className="w-4 h-4 inline mr-3" />
                  Profile Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Icons.generic.settings className="w-4 h-4 inline mr-3" />
                  Preferences
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <Icons.generic.document className="w-4 h-4 inline mr-3" />
                  Help & Support
                </button>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <Icons.buttons.logout className="w-4 h-4 inline mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="sm:hidden">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Icons.buttons.menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FixedHeader;
