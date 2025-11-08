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
        regularDetailBg: `${cardColorHex}10`, // 10% Opacity - matches icon-bg
        regularDetailBorder: `${cardColorHex}30`, // 30% Opacity - matches card color theme
        iconStyle: { color: cardColorHex },
        valueStyle: { color: cardColorHex },
        dotStyle: { backgroundColor: cardColorHex, background: cardColorHex },
        gradientBg: `linear-gradient(135deg, ${cardColorHex}15 0%, ${cardColorHex}05 100%)`,
        iconGradient: `linear-gradient(135deg, ${cardColorHex} 0%, ${cardColorHex}dd 100%)`,
      }),
      [cardColorHex]
    );

    return (
      <div className="card-small-modern group">
        {/* Accent border on top */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-xl "
          style={{
            background: `linear-gradient(90deg, ${cardColorHex} 0%, ${cardColorHex}cc 50%, ${cardColorHex} 100%)`,
          }}
        />

        <div className="flex flex-col h-full relative z-10">
          {/* Modern Header Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Modern Icon with gradient background */}
              <div
                className="relative flex-shrink-0"
                style={{
                  background: styles.iconGradient,
                  borderRadius: "12px",
                  padding: "10px",
                  boxShadow: `0 4px 12px ${cardColorHex}25`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl "
                  style={{ background: cardColorHex }}
                />
                <card.icon className="relative w-5 h-5 text-white" />
              </div>

              {/* Title & Subtitle with better typography */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 truncate">
                  {card.title}
                </h4>
                {card.subtitle && (
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                    {card.subtitle}
                  </h5>
                )}
              </div>
            </div>

            {/* Status Badge - Modern positioning */}
            {card.badge && (
              <div className="flex-shrink-0 ml-2">
                <Badge
                  size="sm"
                  className="shadow-sm"
                  style={{
                    color: cardColorHex,
                    backgroundColor: `${cardColorHex}15`,
                    borderColor: `${cardColorHex}30`,
                    borderWidth: "1px",
                    borderStyle: "solid",
                  }}
                >
                  {card.badge.text}
                </Badge>
              </div>
            )}
          </div>

          {/* Main Content Section */}
          <div className="flex-1 flex flex-col">
            {/* Value Display - Prominent */}
            <div className="mb-4">
              <p
                className="text-4xl font-bold mb-2 leading-tight tracking-tight"
                style={styles.valueStyle}
              >
                {card.value}
              </p>
              {card.description && (
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                  {card.description}
                </p>
              )}
            </div>

            {/* Filters/Inputs Content */}
            {card.content && (
              <div className="leading-relaxed mb-4 text-sm">{card.content}</div>
            )}

            {/* Details Section - Modern Cards */}
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
                      <div key={index} className="space-y-2.5">
                        {/* Subcategory title */}
                        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          {detail.label}
                        </h4>

                        {/* Markets section - Modern card design */}
                        <div
                          className="p-2 rounded-xl border "
                          style={{
                            background: styles.gradientBg,
                            borderColor: styles.regularDetailBorder,
                            boxShadow: `0 2px 8px ${cardColorHex}10`,
                          }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-200/20 dark:border-gray-700/30">
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                Markets
                              </p>
                              <div
                                className="text-xs font-bold px-2 py-0.5 rounded-md"
                                style={{
                                  color: cardColorHex,
                                  backgroundColor: `${cardColorHex}15`,
                                }}
                              >
                                {detail.value}
                              </div>
                            </div>
                            {/* Market badges - Modern layout */}
                            <div className="flex flex-wrap gap-1.5">
                              {sortedBadges.map(
                                ([market, count], badgeIndex) => (
                                  <Badge
                                    key={badgeIndex}
                                    size="sm"
                                    className="border"
                                    style={{
                                      color: cardColorHex,
                                      backgroundColor: `${cardColorHex}15`,
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
                    // Regular detail item - Modern design
                    return (
                      <div
                        key={index}
                        className="p-2 rounded-lg border flex items-center justify-between "
                        style={{
                          background: styles.gradientBg,
                          borderColor: styles.regularDetailBorder,
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                            style={{
                              ...styles.dotStyle,
                              boxShadow: `0 0 8px ${cardColorHex}60`,
                            }}
                          />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {detail.label}
                          </span>
                        </div>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-md"
                          style={{
                            color: cardColorHex,
                            backgroundColor: `${cardColorHex}15`,
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
