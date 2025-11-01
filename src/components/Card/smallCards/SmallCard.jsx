import React, { useMemo, memo } from "react";
// Assuming these are globally available or imported correctly
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";

// --- Type Definitions (Conceptual, for clarity) ---
// type CardDetail = { label: string; value: string | number; badges?: Record<string, number> };
// type CardProp = {
//   id: string;
//   color: keyof typeof CARD_SYSTEM.COLOR_HEX_MAP; // e.g., 'blue', 'red'
//   icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
//   title: string;
//   subtitle: string;
//   value: string | number;
//   description?: string;
//   badge?: { text: string; color: string; colorHex?: string };
//   content?: React.ReactNode;
//   details?: CardDetail[];
//   badges?: { text: string; color?: string; colorHex?: string }[];
// };

// Unified background color for all card details (Slate-600 equivalent)
const DETAILS_BG_COLOR_HEX = "#1f2334"; // Slate-600-ish - Modern, professional

/**
 * Dynamic Small Card Component
 * Memoized for high performance on dashboards.
 */
const SmallCard = memo(({ card }) => {
  // 1. Performance: Memoize color calculation
  const cardColorHex = useMemo(
    () => CARD_SYSTEM.COLOR_HEX_MAP[card.color] || "#64748b",
    [card.color]
  );

  // 2. Style Abstraction: Derive consistent detail styles using the base color
  const styles = useMemo(() => ({
    // Opacity variations for the consistent dark background
    regularDetailBg: `${DETAILS_BG_COLOR_HEX}30`, // 30% Opacity
    regularDetailBorder: `${DETAILS_BG_COLOR_HEX}80`, // 80% Opacity
    subcategoryBg: `${DETAILS_BG_COLOR_HEX}90`, // 90% Opacity

    // Dynamic style objects applied using the card's theme color
    iconStyle: { color: cardColorHex },
    valueStyle: { color: cardColorHex },
    
    // Style for the color dot in regular details
    dotStyle: { backgroundColor: cardColorHex, background: cardColorHex },
  }), [cardColorHex]);

  return (
    // Use an explicit dark background class for better theme integration
    <div className="card-small p-4 bg-[#1f2334] rounded-xl shadow-lg border border-[#2c3042]">
      <div className="flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Icon - Using 'bg-primary' which should be defined elsewhere (e.g., Tailwind config) */}
            <div className="icon-bg bg-primary p-2 rounded-full flex items-center justify-center">
              <card.icon
                className="w-6 h-6"
                style={styles.iconStyle}
              />
            </div>
            {/* Title & Subtitle */}
            <div className="leading-tight"> {/* Changed leading-2 to leading-tight or similar utility */}
              <h4 className="text-sm font-semibold text-gray-300 !mb-0">
                {card.title}
              </h4>
              <h5 className="text-xs text-gray-400 mt-0">
                {card.subtitle}
              </h5>
            </div>
          </div>
          
          {/* Status Badge */}
          {card.badge && (
            <Badge 
              color={card.badge.color}
              size="sm"
              className="text-xs shrink-0"
            >
              {card.badge.text}
            </Badge>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Main Value */}
          <div className="mb-6">
            <p className="text-3xl font-bold mb-2" style={styles.valueStyle}>
              {card.value}
            </p>
            <p className="text-sm text-gray-400">{card.description}</p>
          </div>

          {/* Custom Content */}
          {card.content && (
            <div className="mb-4">
              {card.content}
            </div>
          )}

          {/* Enhanced Data Details */}
          {card.details && card.details.length > 0 && (
            <div className="space-y-1">
              {card.details.map((detail, index) => {
                const hasBadges = detail.badges && Object.keys(detail.badges).length > 0;
                
                // --- SUB-CATEGORY DETAIL LAYOUT ---
                if (hasBadges) {
                  const sortedBadges = Object.entries(detail.badges || {})
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);

                  return (
                    <div key={index} className="space-y-2">
                      {/* Subcategory title */}
                      <h4 className="text-sm font-semibold text-gray-200 capitalize mt-2">
                        {detail.label}
                      </h4>
                      
                      {/* Markets section with background */}
                      <div 
                        className="p-2 rounded-lg border"
                        style={{ 
                          backgroundColor: styles.subcategoryBg,
                          borderColor: styles.subcategoryBg
                        }}
                      >
                        <div className="space-y-2">
                          {/* Markets label / Task count */}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">Markets:</p>
                            <div className="text-xs font-medium text-gray-300">
                              {detail.value} {/* Assumed to be the total count */}
                            </div>
                          </div>
                          
                          {/* Market badges */}
                          <div className="flex flex-wrap gap-1">
                            {sortedBadges.map(([market, count], badgeIndex) => (
                              <span
                                key={badgeIndex}
                                className="inline-flex items-center px-1 py-0.5 text-xs font-medium rounded whitespace-nowrap"
                                style={{
                                  // Dark text for contrast against tinted background
                                  color: DETAILS_BG_COLOR_HEX, 
                                  // Background tinted with card's color
                                  backgroundColor: `${cardColorHex}90`, 
                                  border: `1px solid ${cardColorHex}90`,
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
                  // --- REGULAR DETAIL LAYOUT ---
                  return (
                    <div 
                      key={index}
                      className="p-2 rounded-lg border flex items-center justify-between" // Combined flex class for better layout
                      style={{ 
                        backgroundColor: styles.regularDetailBg,
                        borderColor: styles.regularDetailBorder
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        {/* Color Dot */}
                        <div 
                          className="w-1.5 h-1.5 rounded-full"
                          style={styles.dotStyle}
                        ></div>
                        <span className="text-xs text-gray-400">{detail.label}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-300">
                        {detail.value}
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {/* Footer Badges */}
          {card.badges && card.badges.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-t-[#2c3042]"> {/* Added top border for separation */}
              {card.badges.map((badge, index) => (
                <Badge
                  key={index}
                  size="sm"
                  color={badge.color} // Use badge color if provided
                  colorHex={badge.colorHex || cardColorHex} // Fallback to card color
                >
                  {badge.text}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 3. Custom memo comparison: Refined for clarity and safety
  const prevCard = prevProps.card;
  const nextCard = nextProps.card;
  
  // Shallow compare critical scalar properties
  if (
    prevCard.id !== nextCard.id ||
    prevCard.color !== nextCard.color ||
    prevCard.value !== nextCard.value ||
    prevCard.title !== nextCard.title ||
    prevCard.subtitle !== nextCard.subtitle
  ) {
    return false; // Re-render if any scalar value changes
  }

  // Deep compare arrays (expensive, but necessary if immutable updates aren't guaranteed)
  // NOTE: This check includes `content` and `badge` props, which is slightly more robust
  // than only checking `details`.
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
});

SmallCard.displayName = 'SmallCard';

export default SmallCard;