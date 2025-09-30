import React from "react";
import { Icons } from "@/components/icons";
import { getCardColorHex } from "@/components/Card/cardConfig";

// Small Card Component for inside the large card
const SmallCard = ({ title, icon, data, color, className = "" }) => {
  const cardColorHex = getCardColorHex(color);
  
  return (
    <div className={`bg-gray-800/50 border border-gray-700/30 rounded-lg p-4 hover:bg-gray-800/70 transition-colors ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
        {icon && React.createElement(icon, {
          className: "w-5 h-5",
          style: { color: cardColorHex }
        })}
      </div>

      {/* Content */}
      <div className="space-y-2">
        {data && data.length > 0 ? (
          data.map((item, index) => (
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
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-300">
                  {item.value}
                </span>
              </div>
              
              {/* Show hours value if available */}
              {item.hoursValue && (
                <div className="ml-4 mt-1">
                  <span className="text-xs text-gray-500">total hrs {item.hoursValue}</span>
                </div>
              )}
              
              {/* Show market badges if available */}
              {item.subValue && item.subValue !== 'No markets' && (
                <div className="ml-4 mt-2">
                  <div className="text-xs text-gray-500 mb-1">markets:</div>
                  <div className="flex flex-wrap gap-1">
                    {item.subValue.split(' ').map((market, marketIndex) => (
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
          ))
        ) : (
          <div className="text-center py-4">
            <span className="text-xs text-gray-500">No data available</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Market Badge Component
const MarketBadge = ({ market, count, color }) => {
  const cardColorHex = getCardColorHex(color);
  
  return (
    <div 
      className="px-2 py-1 rounded text-xs font-semibold text-white shadow-sm"
      style={{ backgroundColor: cardColorHex }}
    >
      {count}x{market}
    </div>
  );
};

// Main Large Analytics Card Component
const LargeAnalyticsCard = ({ 
  title,
  subtitle,
  icon,
  color = "blue",
  top3Data = {},
  marketBadges = [],
  className = "",
  isLoading = false
}) => {
  const cardColorHex = getCardColorHex(color);

  if (isLoading) {
    return (
      <div className={`card-large ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-large ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div 
          className="p-4 rounded-xl flex items-center justify-center shadow-lg border border-gray-600/30"
          style={{ backgroundColor: `${cardColorHex}20` }}
        >
          {icon && React.createElement(icon, {
            className: "w-8 h-8",
            style: { color: cardColorHex }
          })}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Market Badges Section */}
      {marketBadges && marketBadges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Markets</h3>
          <div className="flex flex-wrap gap-3">
            {marketBadges.map((badge, index) => (
              <MarketBadge 
                key={index}
                market={badge.market}
                count={badge.count}
                color={color}
              />
            ))}
          </div>
        </div>
      )}

      {/* Small Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* All Users */}
        {top3Data.top3Users && top3Data.top3Users.length > 0 && (
          <SmallCard
            title="All Users"
            icon={Icons.generic.user}
            data={top3Data.top3Users}
            color={color}
          />
        )}

        {/* All Products */}
        {top3Data.top3Products && top3Data.top3Products.length > 0 && (
          <SmallCard
            title="All Products"
            icon={Icons.generic.package}
            data={top3Data.top3Products}
            color={color}
          />
        )}

        {/* All Markets */}
        {top3Data.top3Markets && top3Data.top3Markets.length > 0 && (
          <SmallCard
            title="All Markets"
            icon={Icons.generic.trendingUp}
            data={top3Data.top3Markets}
            color={color}
          />
        )}

        {/* All AI Models */}
        {top3Data.top3AIModels && top3Data.top3AIModels.length > 0 && (
          <SmallCard
            title="All AI Models"
            icon={Icons.generic.ai}
            data={top3Data.top3AIModels}
            color={color}
          />
        )}

        {/* All Reporters */}
        {top3Data.top3Reporters && top3Data.top3Reporters.length > 0 && (
          <SmallCard
            title="All Reporters"
            icon={Icons.admin.reporters}
            data={top3Data.top3Reporters}
            color={color}
          />
        )}

        {/* Total Hours */}
        {top3Data.totalHours && (
          <SmallCard
            title="Total Hours"
            icon={Icons.generic.clock}
            data={[
              {
                icon: Icons.generic.clock,
                label: "Total Hours",
                value: `${top3Data.totalHours}h`
              },
              {
                icon: Icons.generic.ai,
                label: "AI Hours",
                value: `${top3Data.totalAIHours || 0}h`
              }
            ]}
            color={color}
          />
        )}
      </div>
    </div>
  );
};

export default LargeAnalyticsCard;
