import React, { useMemo, memo } from "react";
// Assuming these are globally available or imported correctly
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";

const SmallCard = memo(
  ({ card }) => {
    const cardColorHex = useMemo(
      () => CARD_SYSTEM.COLOR_HEX_MAP[card.color] || "#64748b",
      [card.color]
    );
    const styles = useMemo(
      () => ({
        regularDetailBg: `${cardColorHex}08`, // 8% Opacity - more subtle
        regularDetailBorder: `${cardColorHex}20`, // 20% Opacity - softer borders
        iconStyle: { color: cardColorHex },
        valueStyle: { color: cardColorHex },
        dotStyle: { backgroundColor: cardColorHex },
        iconBg: `${cardColorHex}12`, // 12% Opacity for icon background
        hoverGlow: `0 0 0 1px ${cardColorHex}15, 0 4px 12px ${cardColorHex}08`,
      }),
      [cardColorHex]
    );

    return (
      <div 
        className="card-small-modern overflow-hidden p-3 py-4 rounded-bl-none rounded-tl-none"
      >
        {/* Subtle left accent line instead of top border */}
        <div
          className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-xl"
          style={{
            backgroundColor: cardColorHex,
            opacity: 0.6,
          }}
        />

        <div className="flex flex-col h-full relative z-10 overflow-hidden pl-2">
          {/* Minimalist Header Section */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Clean Icon with subtle background */}
              <div
                className="relative flex-shrink-0"
                style={{
                  background: styles.iconBg,
                  borderRadius: "10px",
                  padding: "8px",
                }}
              >
                <card.icon 
                  className="relative w-4 h-4" 
                  style={styles.iconStyle}
                />
              </div>

              {/* Title & Subtitle - Clean typography */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 truncate leading-tight">
                  {card.title}
                </h4>
                {card.subtitle && (
                  <h5 className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {card.subtitle}
                  </h5>
                )}
              </div>
            </div>

            {/* Status Badge - Minimalist positioning */}
            {card.badge && (
              <div className="flex-shrink-0 ml-2">
                <Badge
                  size="sm"
                  className="shadow-none border-0"
                  variant={card.badge.color}
                >
                  {card.badge.text}
                </Badge>
              </div>
            )}
          </div>

          {/* Main Content Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Value Display - Clean and prominent */}
            <div className="mb-5">
              <p
                className="text-3xl font-bold mb-1.5 leading-none tracking-tight"
                style={styles.valueStyle}
              >
                {card.value}
              </p>
              {card.description && (
                <p className="text-xs font-normal text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                  {card.description}
                </p>
              )}
            </div>

            {/* Filters/Inputs Content */}
            {card.content && (
              <div className="leading-relaxed mb-4 text-sm overflow-hidden">{card.content}</div>
            )}

            {/* Details Section - Minimalist Cards */}
            {card.details && card.details.length > 0 && (
              <div className="space-y-2 mt-auto">
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
                        {/* Subcategory title - Minimalist */}
                        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {detail.label}
                        </h4>

                        {/* Markets section - Clean card design */}
                        <div
                          className="p-3 rounded-lg border"
                          style={{
                            background: styles.regularDetailBg,
                            borderColor: styles.regularDetailBorder,
                          }}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-200/30 dark:border-gray-700/20">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                Markets
                              </p>
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded"
                                style={{
                                  color: cardColorHex,
                                  backgroundColor: `${cardColorHex}12`,
                                }}
                              >
                                {detail.value}
                              </span>
                            </div>
                            {/* Market badges - Clean layout */}
                            <div className="flex flex-wrap gap-1.5">
                              {sortedBadges.map(
                                ([market, count], badgeIndex) => (
                                  <Badge
                                    key={badgeIndex}
                                    size="sm"
                                    className="border-0 shadow-none"
                                    style={{
                                      color: cardColorHex,
                                      backgroundColor: `${cardColorHex}12`,
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
                    // Regular detail item - Minimalist design
                    return (
                      <div
                        key={index}
                        className="p-2.5 rounded-lg border flex items-center justify-between"
                        style={{
                          background: styles.regularDetailBg,
                          borderColor: styles.regularDetailBorder,
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={styles.dotStyle}
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {detail.label}
                          </span>
                        </div>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{
                            color: cardColorHex,
                            backgroundColor: `${cardColorHex}12`,
                          }}
                        >
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
