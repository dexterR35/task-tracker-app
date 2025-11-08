import React from "react";
import Badge from "@/components/ui/Badge/Badge";
import { CARD_SYSTEM } from "@/constants";

/**
 * Reusable Chart Header Component
 * Displays a modern chart header with accent bar, icon, title, and badges
 * 
 * @param {string} title - The chart title
 * @param {Array<{label: string, value: string|number}>} badges - Array of badge objects with label and value
 * @param {string} color - Optional color from CARD_SYSTEM.COLOR_HEX_MAP (defaults to 'color_default')
 * @param {React.ReactNode} icon - Optional custom icon (defaults to chart icon)
 * @param {boolean} showIcon - Whether to show the icon (defaults to true)
 * @param {string} className - Additional CSS classes
 */
const ChartHeader = ({
  title,
  badges = [],
  color = CARD_SYSTEM.COLOR_HEX_MAP.color_default,
  icon = null,
  showIcon = true,
  className = "",
}) => {
  // Default chart icon
  const defaultIcon = (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const displayIcon = icon || defaultIcon;

  return (
    <div className={`relative px-5 py-4 overflow-hidden ${className}`}>
      {/* Accent bar line on top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
        style={{
          background: `linear-gradient(90deg, ${color} 0%, ${color}cc 50%, ${color} 100%)`,
        }}
      />
      <div className="flex items-center gap-3 pt-2 relative z-10">
        {/* Icon with gradient background */}
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
          <h5 className="font-semibold text-gray-900 dark:text-white text-base">
            <span>{title}</span>
          </h5>
        </div>
        {badges.length > 0 && (
          <div className="flex items-center gap-2">
            {badges.map((badge, index) => (
              <Badge 
                key={index}
                variant="select_badge" 
                size="sm"
                style={{
                  color: color,
                  backgroundColor: `${color}15`,
                  borderColor: `${color}30`,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                }}
              >
                {badge.value}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartHeader;

