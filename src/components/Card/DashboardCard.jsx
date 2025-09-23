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
    <div className="bg-gray-800 border border-gray-700/50 rounded-lg p-4 w-full">
      <div className="h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div
                className="p-3 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${cardColorHex}20` }}
              >
                <card.icon
                  className="w-6 h-6"
                  style={{ color: cardColorHex }}
                />
              </div>
              <div className="leading-6">
                <h3 className="text-sm font-semibold text-gray-300 !mb-0">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0">{card.subtitle}</p>
              </div>
            </div>

            {/* Trend Indicator */}
            {card.trend && (
              <div className="flex items-center space-x-1 px-2 py-1 rounded bg-gray-700/30">
                {getTrendIconComponent(card.trendDirection)}
                <span className="text-xs font-medium text-green-success">
                  {card.trend}
                </span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-6">
              <div className="text-3xl font-bold text-gray-100 mb-2">
                {card.value}
              </div>
              <div className="text-sm text-gray-400 mb-1">{card.description}</div>
            </div>

            {/* Badges Section - Current Active or Markets */}
            {card.badges && card.badges.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {card.badges.map((badge, index) => (
                    <Badge 
                      key={index} 
                      variant="default"
                      size="sm"
                      className="text-white text-xs px-3 py-1.5 font-semibold shadow-md rounded-md ring-1 ring-black/10"
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
              <div className="mb-6 h-16">
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

            {/* Enhanced Data - Matching Top Cards Design */}
            {card.details && (
              <div className="space-y-3 mb-6">
                {card.details.filter(detail => !detail.isHeader).slice(0, 4).map((detail, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icons.generic.user className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">{detail.label}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-300">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
