import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Icons } from "@/components/icons";
import MidnightCountdown from "@/components/ui/MidnightCountdown/MidnightCountdown";
import Badge from "@/components/ui/Badge/Badge";
import Avatar from "@/components/ui/Avatar";

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
      icon: Icons.cards.home,
      description: "Task management"
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: Icons.cards.chart,
      adminOnly: true,
      description: "Data insights"
    },
    {
      name: "Users",
      href: "/users",
      icon: Icons.admin.users,
      adminOnly: true,
      description: "User management"
    },
    {
      name: "Debug",
      href: "/debug",
      icon: Icons.admin.debug,
      adminOnly: true,
      description: "System debug"
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-r border-gray-300/50 dark:border-gray-700/50">
      {/* Logo Section */}
      <div className="flex items-center h-20 px-6 border-b border-gray-300/50 dark:border-gray-700/50">
        <Link
          to="/dashboard"
          className="flex items-center space-x-3 group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-default to-btn-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              SYNC
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Task Tracker
            </p>
          </div>
        </Link>
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => {
          // Hide admin-only items for non-admin users
          if (item.adminOnly && !canAccess("admin")) return null;
          
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/20"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="ml-3 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-6 border-t border-gray-300/50 dark:border-gray-700/50 space-y-4">
        {/* Midnight Countdown */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
          <MidnightCountdown />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all duration-200 group"
        >
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-all duration-200">
            <Icons.buttons.logout className="w-5 h-5" />
          </div>
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
