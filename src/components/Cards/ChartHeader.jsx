import React, { useMemo } from "react";
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
  children = null, // Chart content to wrap
}) => {
  // Default chart icon
  const ChartIcon = Icons.generic.chart;
  const defaultIcon = <ChartIcon className="w-5 h-5 text-white" />;

  const displayIcon = icon || defaultIcon;

  // Calculate styles for icon gradient
  const iconStyles = useMemo(() => ({
    iconGradient: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
    boxShadow: `0 4px 12px ${color}25`,
  }), [color]);

  // Section variant has different styling - acts as card container
  const isSection = variant === "section";
  const containerClasses = isSection 
    ? `card-small-modern overflow-visible p-0 relative rounded-bl-none rounded-tl-none ${className}`
    : `relative ${className}`;
  
  // Check if padding should be removed (when className contains !px-0 or similar)
  const hasNoPadding = className.includes("!px-0") || className.includes("px-0");
  // For section variant with left accent bar, add extra left padding to account for the bar
  const innerPadding = hasNoPadding ? "" : (isSection ? "px-5 pt-4 pl-6" : "px-5 pt-4");
  
  // Always use h3 for title
  const titleClasses = isSection 
    ? "text-base font-bold text-gray-900 dark:text-white mb-0.5"
    : "text-base font-semibold text-gray-900 dark:text-white";

  return (
    <div className={containerClasses}>
      {/* Subtle left accent line instead of top border - only show if variant is section */}
      {variant === "section" && (
        <div
          className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-xl transition-all duration-300"
          style={{
            backgroundColor: color,
            opacity: 0.6,
          }}
        />
      )}
      <div className={`flex items-end gap-3 relative z-10 ${innerPadding}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon with gradient background - matching card-small-modern */}
          {showIcon && (
            <div 
              className="relative flex-shrink-0"
              style={{
                background: iconStyles.iconGradient,
                borderRadius: "12px",
                padding: "10px",
                boxShadow: iconStyles.boxShadow,
              }}
            >
              <div
                className="absolute inset-0 rounded-xl"
                style={{ background: color }}
              />
              <div className="relative">
                {displayIcon}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`${titleClasses} truncate`}>
              <span>{title}</span>
            </h3>
            {subtitle && (
              <p className={`${isSection ? "text-sm" : "text-xs"} text-gray-500 dark:text-gray-400 truncate`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badges.length > 0 && (
          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            {badges.map((badge, index) => (
              <Badge 
                key={index}
                variant="green" 
                size="sm"
                className="shadow-sm"
              >
                {typeof badge === 'string' ? badge : badge.value || badge}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {/* Chart content - only render if children provided and variant is section */}
      {children && variant === "section" && (
        <div className="px-5 pb-5 pl-6 relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartHeader;

