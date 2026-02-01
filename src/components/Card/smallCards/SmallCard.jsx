import React, { useMemo } from "react";
import { CARD_SYSTEM } from "@/constants";
import { Icons } from "@/components/icons";

const SmallCard = ({ card }) => {
  if (!card || !card.color) return null;

  const cardColorHex = useMemo(
    () => CARD_SYSTEM.COLOR_HEX_MAP[card.color] || "#64748b",
    [card.color]
  );
  const badgeColorHex = useMemo(
    () =>
      (card.badge?.color ? CARD_SYSTEM.COLOR_HEX_MAP[card.badge.color] : null) ||
      cardColorHex,
    [card.badge?.color, cardColorHex]
  );
  const styles = useMemo(
    () => ({
      stripBg: cardColorHex,
      valueColor: cardColorHex,
      iconBg: `${cardColorHex}18`,
      iconColor: cardColorHex,
    }),
    [cardColorHex]
  );

  const Icon = card.icon;
  const hasDetails = card.details?.length > 0;
  const badgeText = card.badge?.text ?? card.subtitle ?? "—";

  return (
    <div className="card-credit">
      <div
        className="card-credit-strip-left"
        style={{ backgroundColor: styles.stripBg }}
      />
      <div className="card-credit-inner">
        <div className="card-credit-header">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <p className="card-credit-label">{card.title}</p>
            <p className="card-credit-value" style={{ color: styles.valueColor }}>
              {card.value}
            </p>
            <span
              className="card-credit-badge"
              style={{
                backgroundColor: `${badgeColorHex}22`,
                color: badgeColorHex,
              }}
            >
              {badgeText}
            </span>
          </div>
          <div className="flex justify-between flex-col items-center gap-2 shrink-0 min-w-0">
            <div
              className="card-credit-icon"
              style={{ backgroundColor: styles.iconBg, color: styles.iconColor }}
            >
              <Icon className="w-4 h-4" />
            </div>
           
            <div className=" gap-1 min-w-0 w-fit">
              <Icons.buttons.chevronRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" aria-hidden />
     
            </div>
           
          </div>
        </div>
        {hasDetails && (
          <>
            <div className="card-credit-divider" aria-hidden />
            <div className="card-credit-info">
              {card.details.map((detail, index) => (
                <div key={index} className="card-credit-info-row">
                  <span className="card-credit-info-label">{detail.label}</span>
                  <span className="card-credit-info-value">{detail.value}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmallCard;
