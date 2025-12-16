import React, { useMemo } from "react";
import { CARD_SYSTEM } from "@/constants";
import Badge from "@/components/ui/Badge/Badge";

const SmallCard = ({ card }) => {
  // Guard against null/undefined card or missing color
  if (!card || !card.color) return null;

  const cardColorHex = useMemo(
    () => CARD_SYSTEM.COLOR_HEX_MAP[card.color] || "#64748b",
    [card.color]
  );
  const styles = useMemo(
    () => ({
      regularDetailBg: `${cardColorHex}08`, // 8% Opacity - more subtle
      regularDetailBorder: `${cardColorHex}40`, // 20% Opacity - softer borders
      iconStyle: { color: cardColorHex },
      valueStyle: { color: cardColorHex },
      dotStyle: { backgroundColor: cardColorHex },
      iconBg: `${cardColorHex}20`, // 12% Opacity for icon background
      // hoverGlow: `0 0 0 1px ${cardColorHex}15, 0 4px 12px ${cardColorHex}08`,
    }),
    [cardColorHex]
  );

  return (
    <div className="card-small-modern">
      <div
        className="absolute top-0 left-0 bottom-0 w-0.5 rounded-l-xl"
        style={{
          backgroundColor: cardColorHex,
          opacity: 0.8,
        }}
      />

      <div className="flex flex-col h-full relative z-2 pl-2">
        {/*  Header Section */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="relative flex-shrink-0 p-2 rounded-lg"
              style={{
                background: styles.iconBg,
              }}
            >
              <card.icon
                className="relative w-4 h-4"
                style={styles.iconStyle}
              />
            </div>

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-0.5 truncate leading-tight">
                {card.title}
              </h4>
              {card.subtitle && (
                <h5 className="text-xs font-normal truncate mt-0.5">
                  {card.subtitle}
                </h5>
              )}
            </div>
          </div>

          {/* Status Badge */}
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
        <div className="flex-1 flex flex-col">
          {/* Value Display */}
          <div className="mb-4">
            <p
              className="text-3xl font-bold mb-0 leading-none"
              style={styles.valueStyle}
            >
              {card.value}
            </p>
            {card.description && (
              <p className="text-xs font-normal mt-2">{card.description}</p>
            )}
          </div>
          {/*Filters/Inputs*/}
          {card.content && (
            <div className="leading-relaxed mb-4">{card.content}</div>
          )}
          {/* Details Section  */}
          {card.details && card.details.length > 0 && (
            <div className="space-y-2 mt-auto">
              {card.details.map((detail, index) => {
                return (
                  <div
                    key={index}
                    className="p-2.5 rounded-lg border flex items-center justify-between"
                    style={{
                      background: styles.regularDetailBg,
                      borderColor: styles.regularDetailBorder,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={styles.dotStyle}
                      />
                      <span className="text-xs font-medium">
                        {detail.label}
                      </span>
                    </div>
                    <Badge
                      size="sm"
                      className="shadow-none border-0 !text-xs"
                      variant={card.badge?.color || card.color}
                    >
                      {detail.value}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmallCard;
