import React, { useMemo, memo } from "react";
// Assuming these are globally available or imported correctly
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";

const DETAILS_BG_COLOR_HEX = "#64748b"; // bg+border details cards comp

const SmallCard = memo(
  ({ card }) => {
    const cardColorHex = useMemo(
      () => CARD_SYSTEM.COLOR_HEX_MAP[card.color] || "#64748b",
      [card.color]
    );
    const styles = useMemo(
      () => ({
        regularDetailBg: `${cardColorHex}10`, // 20% Opacity - matches icon-bg
        regularDetailBorder: `${cardColorHex}40`, // 50% Opacity - matches card color theme
        iconStyle: { color: cardColorHex },
        valueStyle: { color: cardColorHex },
        dotStyle: { backgroundColor: cardColorHex, background: cardColorHex },
      }),
      [cardColorHex]
    );

    return (
      <div className="card-small">
        <div className="flex flex-col h-full">
          {/* Header (omitted for brevity) */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div 
                className="icon-bg"
                style={{
                  backgroundColor: `${cardColorHex}20`,
                }}
              >
                <card.icon
                  className="w-4.5 h-4.5"
                  style={{
                    color: cardColorHex,
                    regularDetailBg: `${DETAILS_BG_COLOR_HEX}20`,
                  }}
                />
              </div>
              {/* Title & Subtitle */}
              <div>
                <h4>{card.title}</h4>
                <h5>{card.subtitle}</h5>
              </div>
            </div>
            {/* Status Badge */}
            {card.badge && (
              <Badge
                size="sm"
                style={{
                  color: cardColorHex,
                  backgroundColor: `${cardColorHex}20`,
                }}
              >
                {card.badge.text}
              </Badge>
            )}
          </div>
          {/* <p
            className="!h-0.5 rounded mb-2 mt-3"
            style={{
              color: cardColorHex,
              backgroundColor: `${cardColorHex}50`,
            }}
          ></p> */}
          <div className="flex-1">
            <div className="mb-2">
              <p
                className="text-4xl font-semibold mb-1"
                style={styles.valueStyle}
              >
                {card.value}
              </p>
              <p className="text-sm text-gray-400">{card.description}</p>
            </div>
  
            {/* filters inputs content */}
            {card.content && (
              <div className="leading-relaxed mb-4">{card.content}</div>
            )}

    
            {card.details && card.details.length > 0 && (
              <div className="space-y-1.5">
                {card.details.map((detail, index) => {
                  const hasBadges =
                    detail.badges && Object.keys(detail.badges).length > 0;
                  // --- SUB-CATEGORY DETAIL LAYOUT (Market Badges) ---
                  if (hasBadges) {
                    const sortedBadges = Object.entries(detail.badges || {})
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5);

                    return (
                      <div key={index} className="space-y-2">
                        {/* Subcategory title */}
                        <h4 className="text-xs text-gray-300 capitalize ">
                          {detail.label}
                        </h4>

                        {/* Markets section with background */}
                        <div
                          className="p-2 rounded-sm border" // Use rounded-lg for consistency
                          style={{
                            backgroundColor: styles.regularDetailBg,
                            borderColor: styles.regularDetailBorder,
                          }}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-gray-300">Markets:</p>
                              <div className="text-xs font-semibold text-gray-300">
                                {detail.value}
                              </div>
                            </div>
                            {/* Market badges */}
                            <div className="flex flex-wrap gap-1">
                              {sortedBadges.map(
                                ([market, count], badgeIndex) => (
                                  <Badge
                                    key={badgeIndex}
                                    size="sm"
                                    className="border"
                                    style={{
                                      color: cardColorHex,
                                      backgroundColor: `${cardColorHex}20`,
                                      borderColor: `${cardColorHex}40`,
                                    }}
                                  >
                                    {count}x{market.toUpperCase()}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={index}
                        className="p-2 rounded-sm border flex items-center justify-between"
                        style={{
                          backgroundColor: styles.regularDetailBg,
                          borderColor: styles.regularDetailBorder,
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={styles.dotStyle}
                          ></div>
                          <span className="text-xs text-gray-300">
                            {detail.label}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-300">
                          {detail.value}
                        </span>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Memo comparison logic (omitted for brevity)
    const prevCard = prevProps.card;
    const nextCard = nextProps.card;

    if (
      prevCard.id !== nextCard.id ||
      prevCard.color !== nextCard.color ||
      prevCard.value !== nextCard.value ||
      prevCard.title !== nextCard.title ||
      prevCard.subtitle !== nextCard.subtitle
    ) {
      return false;
    }

    const prevJson = JSON.stringify({
      details: prevCard.details,
      badges: prevCard.badges,
      badge: prevCard.badge,
    });
    const nextJson = JSON.stringify({
      details: nextCard.details,
      badges: nextCard.badges,
      badge: nextCard.badge,
    });

    return prevJson === nextJson;
  }
);

SmallCard.displayName = "SmallCard";

export default SmallCard;
