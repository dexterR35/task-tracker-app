import React, { useMemo } from "react";
import CardWithStrip from "@/components/ui/CardWithStrip";
import { CARD_SYSTEM } from "@/constants";

/** Dashboard overview card – title, value, badge, icon, optional details. Uses CardWithStrip. */
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
    <CardWithStrip stripColor={cardColorHex} className="h-full">
      <div className="flex items-stretch justify-between gap-3 m-0">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate leading-[1.3]">
            {card.title}
          </p>
          <p
            className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight [letter-spacing:-0.03em]"
            style={{ color: styles.valueColor }}
          >
            {card.value}
          </p>
          <span
            className="inline-flex items-center rounded px-2 py-0.5 text-sm font-medium truncate max-w-full"
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
            className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
            style={{ backgroundColor: styles.iconBg, color: styles.iconColor }}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>
      {hasDetails && (
        <>
          <div
            className="mt-3 mb-2 h-px bg-gray-100 dark:bg-gray-700/80"
            aria-hidden
          />
          <div className="space-y-1.5">
            {card.details.map((detail, index) => (
              <div
                key={index}
                className="flex items-baseline justify-between gap-3 text-sm font-medium leading-[1.4]"
              >
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 shrink-0 truncate">
                  {detail.label}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate text-right">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </CardWithStrip>
  );
};

export default SmallCard;
