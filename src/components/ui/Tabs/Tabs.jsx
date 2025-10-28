import React, { useState, useCallback } from 'react';
import { CARD_SYSTEM } from '@/constants';

const Tabs = ({
  tabs = [],
  defaultActiveTab = 0,
  onTabChange = null,
  className = "",
  tabClassName = "",
  contentClassName = "",
  variant = "default", // "default" | "pills" | "underline"
  size = "md", // "sm" | "md" | "lg"
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const handleTabClick = useCallback((index, tab) => {
    setActiveTab(index);
    if (onTabChange) {
      onTabChange(index, tab);
    }
  }, [onTabChange]);

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case "pills":
        return {
          container: "bg-gray-100 dark:bg-gray-800 p-1 rounded-lg",
          tab: "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
          activeTab: "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm",
          inactiveTab: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
        };
      case "underline":
        return {
          container: "border-b border-gray-200 dark:border-gray-700",
          tab: "px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-all duration-200",
          activeTab: "text-gray-900 dark:text-white",
          inactiveTab: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
        };
      default:
        return {
          container: "border-b border-gray-200 dark:border-gray-700",
          tab: "px-4 py-2 text-sm font-medium transition-all duration-200",
          activeTab: "text-gray-900 dark:text-white",
          inactiveTab: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        };
    }
  };

  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          tab: "px-3 py-1.5 text-xs",
          content: "pt-3"
        };
      case "lg":
        return {
          tab: "px-6 py-3 text-base",
          content: "pt-6"
        };
      default:
        return {
          tab: "px-4 py-2 text-sm",
          content: "pt-4"
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className={`tabs-container ${className}`}>
      {/* Tab Navigation */}
      <div className={`tabs-nav ${variantStyles.container}`}>
        <nav className="flex space-x-1" role="tablist">
          {tabs.map((tab, index) => {
            const isActive = activeTab === index;
            const tabClasses = `
              ${variantStyles.tab}
              ${sizeStyles.tab}
              ${isActive ? variantStyles.activeTab : variantStyles.inactiveTab}
              ${tabClassName}
              cursor-pointer
              flex items-center space-x-2
            `.trim();

            return (
              <button
                key={tab.id || index}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id || index}`}
                id={`tab-${tab.id || index}`}
                className={tabClasses}
                onClick={() => handleTabClick(index, tab)}
                disabled={tab.disabled}
                style={{
                  borderBottomColor: isActive ? CARD_SYSTEM.COLOR_HEX_MAP.color_default : undefined,
                  color: isActive ? CARD_SYSTEM.COLOR_HEX_MAP.color_default : undefined,
                }}
              >
                {tab.icon && (
                  <span className="flex-shrink-0">
                    {typeof tab.icon === 'string' ? (
                      <span className="text-lg">{tab.icon}</span>
                    ) : (
                      tab.icon
                    )}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className={`tabs-content ${sizeStyles.content} ${contentClassName}`}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          
          return (
            <div
              key={tab.id || index}
              role="tabpanel"
              id={`tabpanel-${tab.id || index}`}
              aria-labelledby={`tab-${tab.id || index}`}
              className={`tab-panel ${isActive ? 'block' : 'hidden'}`}
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
