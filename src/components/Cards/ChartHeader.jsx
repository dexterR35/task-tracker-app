import React from "react";
import Badge from "@/components/ui/Badge/Badge";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";


const ChartHeader = ({
  title,
  subtitle = null,
  badges = [],
  color = CARD_SYSTEM.COLOR_HEX_MAP.blue,
  icon = null,
  showIcon = true,
  className = "",
  variant = "default", // "default" or "section"
}) => {
  // Default chart icon
  const ChartIcon = Icons.generic.chart;
  const defaultIcon = <ChartIcon className="w-5 h-5 text-white" />;

  const displayIcon = icon || defaultIcon;

  // Section variant has different styling
  const isSection = variant === "section";
  const containerClasses = isSection 
    ? `relative bg-white/95 dark:bg-smallCard rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-md mb-6 overflow-hidden ${className}`
    : `relative px-5 py-4 overflow-hidden ${className}`;
  
  // Always use h3 for title
  const titleClasses = isSection 
    ? "text-xl font-bold text-gray-900 dark:text-white mb-0.5"
    : "text-base font-semibold text-gray-900 dark:text-white";

  return (
    <div className={containerClasses}>
      {/* Accent bar line on top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color}cc 50%, ${color} 100%)`,
        }}
      />
      <div className="flex items-center gap-3 pt-2 relative z-10">
        <div className="flex items-center gap-3 flex-1">
          {/* Icon */}
          {showIcon && (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
              }}
            >
              {displayIcon}
            </div>
          )}
          <div className="flex-1">
            <h3 className={titleClasses}>
              <span>{title}</span>
            </h3>
            {subtitle && (
              <p className={isSection ? "text-sm text-gray-500 dark:text-gray-400" : "text-xs text-gray-500 dark:text-gray-400"}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badges.length > 0 && (
          <div className="flex items-center gap-2">
            {badges.map((badge, index) => (
              <Badge 
                key={index}
                variant="green" 
                size="sm"
                className="shadow-sm !text-xl"
              >
                {typeof badge === 'string' ? badge : badge.value || badge}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartHeader;

