import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";
import DynamicButton from "@/components/ui/Button/DynamicButton";

const Sidebar = () => {
  const { logout, clearError, canAccess, user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      clearError();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Icons.generic.home,
      color: "blue",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: Icons.generic.chart,
      adminOnly: true,
      color: "purple",
    },
    {
      name: "Management",
      href: "/users",
      icon: Icons.generic.settings,
      adminOnly: true,
      color: "green",
    },
    {
      name: "Landing Pages",
      href: "/landing-pages",
      icon: Icons.generic.document,
      adminOnly: true,
      color: "orange",
    },
  ];

  const getColorClasses = (color, isActive) => {
    const colorMap = {
      blue: isActive 
        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
        : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30",
      purple: isActive 
        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25" 
        : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30",
      green: isActive 
        ? "bg-green-500 text-white shadow-lg shadow-green-500/25" 
        : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/30",
      orange: isActive 
        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25" 
        : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30",
      indigo: isActive 
        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25" 
        : "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30",
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-smallCard border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header Section */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        
        {/* Design department */}
        {!isCollapsed && (
          <div className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700/30">
            <div className="p-2 rounded-lg bg-blue-500 text-white shadow-md">
              <Icons.generic.settings className="w-4 h-4" />
            </div>
            <div className="ml-2.5 flex-1">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">Design</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">Department</p>
            </div>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          if (item.adminOnly && !canAccess("admin")) return null;

          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] ${
                active
                  ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-all duration-200 ${getColorClasses(item.color, active)}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <div className="ml-2.5 flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                </div>
              )}
              {active && (
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </Link>
          );
        })}
      </nav>



    </div>
  );
};

export default Sidebar;
