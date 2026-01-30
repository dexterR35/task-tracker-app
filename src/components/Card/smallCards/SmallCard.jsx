import React, { useMemo } from "react";
import { CARD_SYSTEM } from "@/constants";

/**
 * Dashboard card – credit-card style: clean layout, label + value + icon, no badges.
 */
const SmallCard = ({ card }) => {
  if (!card || !card.color) return null;

  const cardColorHex = useMemo(
    () => CARD_SYSTEM.COLOR_HEX_MAP[card.color] || "#64748b",
    [card.color]
  );
  const styles = useMemo(
    () => ({
      stripBg: cardColorHex,
      valueColor: cardColorHex,
      iconBg: `${cardColorHex}12`,
      iconColor: cardColorHex,
    }),
    [cardColorHex]
  );

  const Icon = card.icon;

  return (
    <div className="card-credit">
      <div
        className="card-credit-strip card-credit-strip-left"
        style={{ backgroundColor: styles.stripBg }}
      />
      <div className="card-credit-inner">
        <div
          className="card-credit-icon"
          style={{ backgroundColor: styles.iconBg, color: styles.iconColor }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <p className="card-credit-label">{card.title}</p>
        <p className="card-credit-value" style={{ color: styles.valueColor }}>
          {card.value}
        </p>
        {card.details && card.details.length > 0 && (
          <div className="card-credit-info">
            {card.details.map((detail, index) => (
              <div key={index} className="card-credit-info-row">
                <span className="card-credit-info-label">{detail.label}</span>
                <span className="card-credit-info-value">{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmallCard;
