import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";
import { CARD_SYSTEM, NAVIGATION_CONFIG, APP_CONFIG } from '@/constants';

const Sidebar = () => {
  const { logout, clearError, canAccess, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});


  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to home page after logout
      navigate('/', { replace: true });
    } catch (error) {
      clearError();
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleExpanded = (itemName) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const isItemExpanded = (itemName) => {
    return expandedItems[itemName] ?? false;
  };

  const isSubItemActive = (item) => {
    if (!item.subItems) return false;
    return item.subItems.some((subItem) => isActive(subItem.href));
  };

  const navigationItems = NAVIGATION_CONFIG.ITEMS;

  // Auto-expand items when their sub-items are active
  useEffect(() => {
    navigationItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some((subItem) => isActive(subItem.href));
        if (hasActiveSubItem) {
          setExpandedItems((prev) => ({
            ...prev,
            [item.name]: true,
          }));
        }
      }
    });
  }, [location.pathname, navigationItems]);

  const getColorClasses = (color, isActive) => {
    // Use color_default for active icons, gray for inactive
    return isActive 
      ? "shadow-lg shadow-gray-600/25" 
      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600";
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-smallCard  transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header Section */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        
        {/* Office badge */}
        {!isCollapsed && user && (
          <div className="flex items-center px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg ">
            <div 
              className="p-2 rounded-lg text-white shadow-md"
              style={{ backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP[NAVIGATION_CONFIG.DEPARTMENT.color] }}
            >
              {React.createElement(Icons.generic[NAVIGATION_CONFIG.DEPARTMENT.icon], { className: "w-4 h-4" })}
            </div>
            <div className="ml-2.5 flex-1">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">{NAVIGATION_CONFIG.DEPARTMENT.name}</p>
              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium uppercase">{user.office || 'No Office'}</p>
            </div>
          </div>
        )}
      </div>


      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          if (item.adminOnly && !canAccess("admin")) return null;

          const Icon = Icons.generic[item.icon];
          const active = isActive(item.href) || isSubItemActive(item);
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = isItemExpanded(item.name);
          const ChevronIcon = isExpanded ? Icons.buttons.chevronUp : Icons.buttons.chevronDown;
          
          return (
            <div key={item.name} className="space-y-1">
              {hasSubItems ? (
                <>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.name)}
                    className={`group w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] ${
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
                      <>
                        <div className="ml-2.5 flex-1 text-left">
                          <p className="font-medium text-sm">{item.name}</p>
                        </div>
                        <ChevronIcon className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                  {!isCollapsed && isExpanded && hasSubItems && (
                    <div className="ml-4 space-y-1  pl-3">
                      {item.subItems.map((subItem) => {
                        const subActive = isActive(subItem.href);
                        return (
                          <Link
                            key={subItem.name}
                            to={subItem.href}
                            className={`group flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-[1.02] ${
                              subActive
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            }`}
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mr-2" />
                            <p className="font-medium text-sm">{subItem.name}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
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
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Version {APP_CONFIG.VERSION}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
