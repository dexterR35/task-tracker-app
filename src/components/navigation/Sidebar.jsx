import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import {
  ArrowRightOnRectangleIcon,
  UsersIcon,
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  BugAntIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Icons } from "@/components/icons";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";

const Sidebar = ({ onToggle, isOpen }) => {
  const { user, logout, clearError, canAccess } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
      clearError();
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: ChartBarIcon,
      adminOnly: true,
    },
    {
      name: "Users",
      href: "/users",
      icon: UsersIcon,
      adminOnly: true,
    },
    {
      name: "Tasks",
      href: "/tasks",
      icon: ClipboardDocumentListIcon,
      adminOnly: true,
    },
    {
      name: "Debug",
      href: "/debug",
      icon: BugAntIcon,
      adminOnly: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Logo and Close Button */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
        <Link
          to="/dashboard"
          className="uppercase text-2xl font-bold text-gray-800 dark:text-white hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          SYNC
        </Link>
        <button
          onClick={onToggle}
          className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
          aria-label="Close sidebar"
          title="Close sidebar (Ctrl+B)"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Icons.generic.user className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-white truncate capitalize">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
            <span
              className={`inline-block px-2 py-1 mt-1 rounded-full text-xs font-semibold capitalize ${
                canAccess("admin")
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              }`}
            >
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigationItems.map((item) => {
          // Hide admin-only items for non-admin users
          if (item.adminOnly && !canAccess("admin")) return null;
          
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-r-2 border-blue-600 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Dark Mode Toggle */}
        <div className="flex justify-center">
          <DarkModeToggle />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
