import React from "react";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getCardColorHex } from "./cardConfig";

// Modern Area Chart Component
const ModernAreaChart = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={48}>
    <AreaChart
      data={data}
      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
    >
      <defs>
        <linearGradient id={`area-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.8} />
          <stop offset="95%" stopColor={color} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.2} />
      <Area
        type="monotone"
        dataKey="value"
        fill={`url(#area-${color.replace('#', '')})`}
        stroke={color}
        strokeWidth={2}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// Modern Bar Chart Component
const ModernBarChart = ({ data, color }) => (
  <ResponsiveContainer width="100%" height={48}>
    <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
      <defs>
        <linearGradient id={`bar-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.2} />
      <Bar
        dataKey="value"
        fill={`url(#bar-${color.replace('#', '')})`}
        radius={[1, 1, 0, 0]}
        barSize={20}
      />
    </BarChart>
  </ResponsiveContainer>
);


// Dashboard Card Component (based on homepage design)
const DashboardCard = ({ card }) => {
  const cardColorHex = getCardColorHex(card.color);

  const getTrendIconComponent = (direction) => {
    switch (direction) {
      case "up":
        return <Icons.buttons.chevronUp className="w-3 h-3 text-green-success" />;
      case "down":
        return <Icons.buttons.chevronDown className="w-3 h-3 text-red-error" />;
      default:
        return <Icons.buttons.minus className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 w-full">
      <div className="h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div 
                className="p-2 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: cardColorHex }}
              >
                <card.icon className="w-4 h-4 text-white" />
              </div>
              <div className="leading-tight">
                <h3 className="text-xs font-semibold !mb-0">
                  {card.title}
                </h3>
                <p className="text-[10px] mt-0 text-gray-500 dark:text-gray-400">{card.subtitle}</p>
              </div>
            </div>

            {/* Status/Trend Indicator */}
            {card.status && (
              <div 
                className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px]"
                style={{ backgroundColor: cardColorHex }}
              >
                <span className="text-[10px] font-medium text-white">
                  {card.status}
                </span>
              </div>
            )}
            {card.trend && (
              <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-gray-700/30">
                {getTrendIconComponent(card.trendDirection)}
                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">
                  {card.trend}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-3">
              <p className="text-xl font-bold mb-1">
                {card.value}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{card.description}</p>
            </div>

            {/* Badges Section - Current Active or Markets */}
            {card.badges && card.badges.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {card.badges.map((badge, index) => (
                    <Badge 
                      key={index} 
                      variant="default"
                      size="xs"
                      className="text-white text-[8px] px-1.5 py-0.5"
                      style={{ backgroundColor: badge.color || cardColorHex }}
                    >
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Chart Section - Only for cards with charts */}
            {card.hasChart && (
              <div className="mb-3 h-12">
                {card.chartData && card.chartData.length > 0 ? (
                  card.chartType === "bar" ? (
                    <ModernBarChart data={card.chartData} color={cardColorHex} />
                  ) : (
                    <ModernAreaChart data={card.chartData} color={cardColorHex} />
                  )
                ) : (
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">No data</span>
                  </div>
                )}
              </div>
            )}

            {/* Additional Data - Organized by Sections */}
            {card.details && (
              <div className="mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(() => {
                    // Group details by sections
                    const sections = [];
                    let currentSection = null;
                    
                    card.details.forEach((detail, index) => {
                      if (detail.isHeader) {
                        // Start new section
                        if (currentSection) {
                          sections.push(currentSection);
                        }
                        currentSection = {
                          header: detail,
                          items: []
                        };
                      } else if (currentSection) {
                        // Add item to current section
                        currentSection.items.push(detail);
                      }
                    });
                    
                    // Add the last section
                    if (currentSection) {
                      sections.push(currentSection);
                    }
                    
                    return sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="border border-gray-200 dark:border-gray-600 rounded-md p-2 bg-white/50 dark:bg-gray-800/50 space-y-2">
                        {/* Section Header */}
                        <div className="border-b border-gray-200 dark:border-gray-600 pb-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-300">
                              {section.header.label}
                            </span>
                            {section.header.icon && (
                              <section.header.icon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Section Items */}
                        <div className="space-y-1">
                          {section.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-gray-50/50 dark:bg-gray-700/20 rounded p-1.5 border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="flex items-center space-x-1">
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: cardColorHex }}
                                  ></div>
                                  <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                                    {item.label}
                                  </span>
                                </div>
                                <span className="text-[10px] font-semibold text-gray-900 dark:text-gray-100">
                                  {item.value}
                                </span>
                              </div>
                              {(item.subValue || item.hoursValue) && (
                                <div className="ml-3 mt-0.5 space-y-0.5">
                                  {/* Display hours data if available */}
                                  {item.hoursValue && (
                                    <div className="text-[9px] text-gray-600 dark:text-gray-400">
                                      {item.hoursValue}
                                    </div>
                                  )}
                                  
                                  {/* Display market badges if available */}
                                  {item.subValue && !item.subValue.includes('h total') && !item.subValue.includes('h AI') && (
                                    <div className="flex items-center gap-1">
                                      <div className="text-[9px] text-gray-600 dark:text-gray-400">
                                        markets
                                      </div>
                                      <div className="flex flex-wrap gap-0.5">
                                        {item.subValue.split(' ').map((market, index) => (
                                          <Badge 
                                            key={index} 
                                            variant="default"
                                            size="xs"
                                            className="text-white text-[8px] px-1 py-0"
                                            style={{ backgroundColor: cardColorHex }}
                                          >
                                            {market}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Fallback for old format with hours and markets combined */}
                                  {item.subValue && (item.subValue.includes('h total') || item.subValue.includes('h AI')) && (
                                    <div className="text-[9px] text-gray-600 dark:text-gray-400">
                                      {item.subValue}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
