import React from "react";
import { Icons } from "@/components/icons";
import Badge from "@/components/ui/Badge/Badge";

// Get primary color for cards
const getCardColor = (color) => {
  switch (color) {
    case "green":
      return "bg-green-success";
    case "blue":
      return "bg-blue-default";
    case "purple":
      return "bg-btn-primary";
    case "red":
      return "bg-red-error";
    case "yellow":
      return "bg-warning";
    case "pink":
      return "bg-btn-secondary";
    default:
      return "bg-secondary";
  }
};

// Dashboard Card Component (based on homepage design)
const DashboardCard = ({ card }) => {
  const cardColor = getCardColor(card.color);

  const getTrendIconComponent = (direction) => {
    switch (direction) {
      case "up":
        return <Icons.buttons.chevronUp className="w-4 h-4 text-green-success" />;
      case "down":
        return <Icons.buttons.chevronDown className="w-4 h-4 text-red-error" />;
      default:
        return <Icons.buttons.minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 w-full">
      <div className="h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-xl flex items-center justify-center ${cardColor}`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="leading-6">
                <h3 className="text-sm font-semibold !mb-0">
                  {card.title}
                </h3>
                <p className="text-xs mt-0">{card.subtitle}</p>
              </div>
            </div>

            {/* Status/Trend Indicator */}
            {card.status && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded ${cardColor}`}>
                <span className="text-xs font-medium text-white">
                  {card.status}
                </span>
              </div>
            )}
            {card.trend && (
              <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                {getTrendIconComponent(card.trendDirection)}
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {card.trend}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-6">
              <p className="text-3xl font-bold  mb-2">
                {card.value}
              </p>
              <p className="text-sm  mb-1">{card.description}</p>
            </div>

            {/* Chart Section - Only for cards with charts */}
            {card.hasChart && card.chartData && (
              <div className="mb-6 h-16">
                {card.chartType === "bar" ? (
                  <div className="w-full h-full bg-gray-700/30 rounded flex items-center justify-center">
                    <span className="text-xs ">Chart Placeholder</span>
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-700/30 rounded flex items-center justify-center">
                    <span className="text-xs ">Chart Placeholder</span>
                  </div>
                )}
              </div>
            )}

            {/* Additional Data - Organized by Sections */}
            {card.details && (
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div key={sectionIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 space-y-3">
                        {/* Section Header */}
                        <div className="border-b border-gray-200 dark:border-gray-600 pb-2">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-300 flex items-center gap-2">
                            {section.header.icon && (
                              <section.header.icon className="w-4 h-4" />
                            )}
                            {section.header.label}
                          </span>
                        </div>
                        
                        {/* Section Items */}
                        <div className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-gray-50/50 dark:bg-gray-700/20 rounded-md p-2 border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${cardColor}`}></div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {item.label}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                  {item.value}
                                </span>
                              </div>
                              {(item.subValue || item.hoursValue) && (
                                <div className="ml-4 mt-1 space-y-1">
                                  {/* Display hours data if available */}
                                  {item.hoursValue && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                      {item.hoursValue}
                                    </div>
                                  )}
                                  
                                  {/* Display market badges if available */}
                                  {item.subValue && !item.subValue.includes('h total') && !item.subValue.includes('h AI') && (
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs text-gray-600 dark:text-gray-400">
                                        markets
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {item.subValue.split(' ').map((market, index) => (
                                          <Badge 
                                            key={index} 
                                            variant="default"
                                            size="xs"
                                            className="text-white text-[10px] bg-gray-600"
                                          >
                                            {market}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Fallback for old format with hours and markets combined */}
                                  {item.subValue && (item.subValue.includes('h total') || item.subValue.includes('h AI')) && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
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
