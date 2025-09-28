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



const DashboardCard = ({ card }) => {
  const cardColorHex = getCardColorHex(card.color);

  const getTrendIconComponent = (direction) => {
    switch (direction) {
      case "up":
        return <Icons.buttons.chevronUp className="w-3 h-3" style={{ color: cardColorHex }} />;
      case "down":
        return <Icons.buttons.chevronDown className="w-3 h-3" style={{ color: cardColorHex }} />;
      default:
        return <Icons.buttons.minus className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div className="card-large ">
      <div className="h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div
                className="p-4 rounded-lg flex items-center justify-center shadow-lg border border-gray-600/30"
                style={{ backgroundColor: `${cardColorHex}20` }}
              >
                <card.icon
                  className="w-7 h-7"
                  style={{ color: cardColorHex }}
                />
              </div>
              <div className="leading-6">
                <h3 className="text-lg font-bold text-gray-200 !mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-400 mt-0">{card.subtitle}</p>
              </div>
            </div>

            {/* Trend Indicator */}
            {card.trend && (
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-700/40 border border-gray-600/30 shadow-sm">
                {getTrendIconComponent(card.trendDirection)}
                <span className="text-sm font-semibold" style={{ color: cardColorHex }}>
                  {card.trend}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-100 mb-2">
                {card.value}
              </div>
              <div className="text-sm text-gray-400 mb-1">{card.description}</div>
            </div>

            {/* Badges Section - Using Card's Color */}
            {card.badges && card.badges.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {card.badges.map((badge, index) => {
                    return (
                      <div 
                        key={index} 
                        className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold text-white shadow-sm"
                        style={{ backgroundColor: cardColorHex }}
                      >
                        <span>{badge.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chart Section - Only for cards with charts */}
            {card.hasChart && (
              <div className="mb-6 h-20">
                {card.chartData && card.chartData.length > 0 ? (
                  card.chartType === "bar" ? (
                    <ModernBarChart data={card.chartData} color={cardColorHex} />
                  ) : (
                    <ModernAreaChart data={card.chartData} color={cardColorHex} />
                  )
                ) : (
                  <div className="w-full h-full bg-gray-700/50 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-400">No data available</span>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Data - Top 3 Functionality with Consistent Card Color */}
            {card.details && (
              <div className="space-y-2 mb-6">
                {card.details.map((detail, index) => {
                  // Skip if it's a header with no value
                  if (detail.isHeader && !detail.value) {
                    return (
                      <div key={index} className="pt-2 border-t border-gray-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-200">{detail.label}</span>
                          {detail.icon && (
                            <detail.icon 
                              className="w-5 h-5" 
                              style={{ color: cardColorHex }} 
                            />
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Skip headers that are just labels
                  if (detail.isHeader) {
                    return null;
                  }
                  
                  return (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg border hover:bg-gray-700/30 transition-colors"
                      style={{ 
                        backgroundColor: `${cardColorHex}10`,
                        borderColor: `${cardColorHex}20`
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-2 h-2 rounded-full p-1"
                            style={{ 
                              backgroundColor: cardColorHex,
                              padding: '4px',
                              background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                            }}
                          ></div>
                          <span className="text-xs text-gray-400">{detail.label}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-300">
                          {detail.value}
                        </span>
                      </div>
                      
                      {/* Show hours value if available */}
                      {detail.hoursValue && (
                        <div className="ml-4 mt-1">
                          <span className="text-xs text-gray-500">total hrs {detail.hoursValue}</span>
                        </div>
                      )}
                      
                      {/* Show market badges if available */}
                      {detail.subValue && detail.subValue !== 'No markets' && (
                        <div className="ml-4 mt-2">
                          <div className="text-xs text-gray-500 mb-1">markets:</div>
                          <div className="flex flex-wrap gap-1">
                            {detail.subValue.split(' ').map((market, marketIndex) => (
                              <div 
                                key={marketIndex}
                                className="px-2 py-1 rounded text-xs font-semibold text-white"
                                style={{ backgroundColor: cardColorHex }}
                              >
                                {market}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
