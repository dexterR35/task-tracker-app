import React, { useMemo, memo } from "react";
import { Icons } from "@/components/icons";
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";

// Dynamic Small Card Component - Memoized for performance
const SmallCard = memo(({ card }) => {
  // Memoize color calculation to prevent re-computation
  const cardColorHex = useMemo(() => 
    CARD_SYSTEM.COLOR_HEX_MAP[card.color] || "#64748b",
    [card.color]
  );

  // Style objects
  const iconBgStyle = {
    backgroundColor: `${cardColorHex}90`
  };

  const iconStyle = {
    color: cardColorHex
  };

  const badgeStyle = {
    backgroundColor: `${cardColorHex}30`,
    color: cardColorHex,
    border: `1px solid ${cardColorHex}40`,
    fontWeight: '600'
  };

  const valueStyle = {
    color: cardColorHex
  };
  


  return (
    <div className="card-small p-4">
      <div className="h-auto">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className="icon-bg"
                style={iconBgStyle}
              >
                <card.icon
                  className="w-6 h-6"
                  style={iconStyle}
                />
              </div>
              <div className="leading-2">
                <h4 className="text-sm font-semibold text-gray-300 !mb-0">
                  {card.title}
                </h4>
                <h5 className="text-xs text-gray-400 mt-0">
                  {card.subtitle}
                </h5>
              </div>
            </div>
            
            {/* Status Badge - Using Badge component */}
            {card.badge && (
              <Badge 
                color={card.badge.color}
                colorHex={card.badge.colorHex}
                size="sm"
                className="text-xs"
              >
                {card.badge.text}
              </Badge>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Main Value */}
            <div className="mb-6">
              <p className="text-3xl font-bold mb-2" style={valueStyle}>
                {card.value}
              </p>
              <p className="text-sm text-gray-400">{card.description}</p>
            </div>

            {/* Custom Content */}
            {card.content && (
              <div className="mb-6">
                {card.content}
              </div>
            )}

            {/* Enhanced Data */}
            {card.details && card.details.length > 0 && (
              <div className="space-y-1">
                {card.details.map((detail, index) => {
                  // Check if this is a subcategory detail (has badges)
                  const isSubcategory = detail.badges && Object.keys(detail.badges).length > 0;
                  
                  if (isSubcategory) {
                    // Subcategory layout: title (no bg), then markets label, then task count, then badges
                    return (
                      <div key={index} className="space-y-2">
                        {/* Subcategory title - no background/padding */}
                        <h4 className="text-sm font-semibold text-gray-200 capitalize">
                          {detail.label}
                        </h4>
                        
                        {/* Markets section with background */}
                        <div 
                          className="p-2 rounded-lg border"
                          style={{ 
                            backgroundColor: `${cardColorHex}10`,
                            borderColor: `${cardColorHex}20`
                          }}
                        >
                          <div className="space-y-2">
                            {/* Markets label */}
                            <div className="flex items-center justify-between ">
                            <p className="text-xs mb-2">Markets:</p>
                            
                            {/* Task count */}
                            <div className="text-xs font-medium text-gray-300">
                              {detail.value}
                            </div>
                            </div>
                            {/* Market badges */}
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(detail.badges || {})
                                .sort(([,a], [,b]) => b - a)
                                .slice(0, 5)
                                .map(([market, count], badgeIndex) => (
                                  <span
                                    key={badgeIndex}
                                    className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded"
                                    style={{
                                      backgroundColor: `${cardColorHex}30`,
                                      color: cardColorHex,
                                      border: `1px solid ${cardColorHex}40`,
                                      fontWeight: '600'
                                    }}
                                  >
                                    {count}x{market.toUpperCase()}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Regular detail layout
                    return (
                      <div 
                        key={index}
                        className="p-2 rounded-lg border hover:bg-gray-700/30 transition-colors"
                        style={{ 
                          backgroundColor: `${cardColorHex}10`,
                          borderColor: `${cardColorHex}20`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ 
                                backgroundColor: cardColorHex,
                                background: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`
                              }}
                            ></div>
                            <span className="text-xs text-gray-400">{detail.label}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-300">
                            {detail.value}
                          </span>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {/* Badges */}
            {card.badges && card.badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {card.badges.map((badge, index) => (
                  <Badge
                    key={index}
                    size="sm"
                    colorHex={CARD_SYSTEM.COLOR_HEX_MAP[badge.color] || cardColorHex}
                  >
                    {badge.text}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.color === nextProps.card.color &&
    prevProps.card.value === nextProps.card.value &&
    prevProps.card.title === nextProps.card.title &&
    prevProps.card.subtitle === nextProps.card.subtitle &&
    JSON.stringify(prevProps.card.details) === JSON.stringify(nextProps.card.details)
  );
});

SmallCard.displayName = 'SmallCard';

export default SmallCard;
