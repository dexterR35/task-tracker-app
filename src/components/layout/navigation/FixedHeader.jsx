import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icons } from "@/components/icons";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import Avatar from "@/components/ui/Avatar/Avatar";

const FixedHeader = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, canAccess } = useAuth();
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case "/dashboard":
        return canAccess("admin") ? "Task Management" : "My Dashboard";
      case "/analytics":
        return "Analytics";
      case "/users":
        return "User Management";
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
      case "/users":
        return Icons.admin.users;
      default:
        return Icons.cards.home;
    }
  };

  const PageIcon = getPageIcon();

  return (
    <div className="flex items-center justify-between h-full px-3 lg:px-8 bg-secondary ">
      {/* Left Section */}
      <div className="flex items-center space-x-2">
        {/* Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800  "
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Icons.buttons.menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md card">
            <PageIcon className="w-5 h-5 text-blue-default dark:text-blue-default" />
          </div>
          <div>
            <h4 className="capitalize text-sm">{getPageTitle()}</h4>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* User Info */}
        <div className="hidden sm:flex items-center space-x-2 px-2 py-1 card rounded-md">
          <Avatar
            user={user}
            gradient="from-blue-default to-btn-primary"
            size="sm"
            showName={false}
          />
          <div className="text-xs">
            <p className="font-medium text-gray-900 dark:text-white truncate max-w-24 capitalize">
              {user?.name || user?.email}
            </p>
            <p className="text-[10px] capitalize">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Dark Mode Toggle */}
      <div className="hidden sm:block w-10 h-10">
          <DarkModeToggle/>
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
  );
};

export default FixedHeader;
