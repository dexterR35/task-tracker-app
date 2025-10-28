import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import { CARD_SYSTEM, NAVIGATION_CONFIG } from '@/constants';

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

  const navigationItems = NAVIGATION_CONFIG.ITEMS;

  const getColorClasses = (color, isActive) => {
    // Use color_default for active icons, gray for inactive
    return isActive 
      ? "shadow-lg shadow-gray-600/25" 
      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600";
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-smallCard border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header Section */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        
        {/* Design department */}
        {!isCollapsed && (
          <div className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700/30">
            <div 
              className="p-2 rounded-lg text-white shadow-md"
              style={{ backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP[NAVIGATION_CONFIG.DEPARTMENT.color] }}
            >
              {React.createElement(Icons.generic[NAVIGATION_CONFIG.DEPARTMENT.icon], { className: "w-4 h-4" })}
            </div>
            <div className="ml-2.5 flex-1">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">{NAVIGATION_CONFIG.DEPARTMENT.name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium">{NAVIGATION_CONFIG.DEPARTMENT.subtitle}</p>
            </div>
          </div>
        )}
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          if (item.adminOnly && !canAccess("admin")) return null;

          const Icon = Icons.generic[item.icon];
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
                style={active ? {
                  backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.color_default,
                  color: 'white'
                } : {}}
              >
                {React.createElement(Icon, { className: "w-4 h-4" })}
              </div>
              {!isCollapsed && (
                <div className="ml-2.5 flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                </div>
              )}
            </Link>
          );
        })}
      </nav>



    </div>
  );
};

export default Sidebar;
